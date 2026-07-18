#!/usr/bin/env php
<?php

declare(strict_types=1);

use Symfony\Component\Yaml\Yaml;

require_once __DIR__.'/../vendor/autoload.php';

const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_ALERTS_FOUND = 2;
const EXIT_ESCALATION_FAILED = 3;

$options = getopt('', [
    'file::',
    'rules::',
    'now::',
]);

$logFile = isset($options['file']) && is_string($options['file']) && '' !== $options['file']
    ? $options['file']
    : __DIR__.'/../var/log/dev.security.log';
$rulesFile = isset($options['rules']) && is_string($options['rules']) && '' !== $options['rules']
    ? $options['rules']
    : __DIR__.'/../config/security_alert_rules.yaml';
$nowInput = isset($options['now']) && is_string($options['now']) && '' !== $options['now']
    ? $options['now']
    : null;

$now = $nowInput ? new DateTimeImmutable((string) $nowInput) : new DateTimeImmutable('now', new DateTimeZone('UTC'));

if (!is_file($logFile)) {
    fwrite(STDERR, sprintf("[ERROR] Log file not found: %s\n", $logFile));
    exit(EXIT_ERROR);
}

if (!is_file($rulesFile)) {
    fwrite(STDERR, sprintf("[ERROR] Rules file not found: %s\n", $rulesFile));
    exit(EXIT_ERROR);
}

try {
    $config = Yaml::parseFile($rulesFile);
} catch (Throwable $e) {
    fwrite(STDERR, sprintf("[ERROR] Cannot parse rules file: %s\n", $e->getMessage()));
    exit(EXIT_ERROR);
}

$rules = $config['rules'] ?? null;
if (!is_array($rules) || [] === $rules) {
    fwrite(STDERR, "[ERROR] No rules found in rules file.\n");
    exit(EXIT_ERROR);
}

$records = loadSecurityRecords($logFile);
$alerts = evaluateRules($rules, $records, $now);

if ([] === $alerts) {
    fwrite(STDOUT, "[OK] No security alerts triggered for current evaluation window.\n");
    exit(EXIT_OK);
}

foreach ($alerts as $alert) {
    fwrite(STDOUT, json_encode($alert, JSON_UNESCAPED_SLASHES).PHP_EOL);
}

$webhookUrl = getenv('SECURITY_ALERT_WEBHOOK_URL') ?: '';
if ('' !== $webhookUrl) {
    $sent = sendWebhookAlert($webhookUrl, [
        'source' => 'backend-security-alert-check',
        'generated_at' => $now->format(DATE_ATOM),
        'alerts_count' => count($alerts),
        'alerts' => $alerts,
    ]);

    if (!$sent) {
        fwrite(STDERR, "[ERROR] Alerts detected but webhook escalation failed.\n");
        exit(EXIT_ESCALATION_FAILED);
    }

    fwrite(STDOUT, sprintf("[OK] %d alert(s) escalated to webhook.\n", count($alerts)));
}

exit(EXIT_ALERTS_FOUND);

/**
 * @return list<array<string, mixed>>
 */
function loadSecurityRecords(string $logFile): array
{
    $records = [];
    $handle = fopen($logFile, 'rb');
    if (false === $handle) {
        return $records;
    }

    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        if ('' === $line) {
            continue;
        }

        $decoded = json_decode($line, true);
        if (!is_array($decoded)) {
            continue;
        }

        $context = $decoded['context'] ?? [];
        if (!is_array($context)) {
            $context = [];
        }

        $record = [
            'datetime' => $decoded['datetime'] ?? null,
            'event_id' => $context['event_id'] ?? null,
            'service' => $context['service'] ?? null,
            'source_ip_masked' => $context['source_ip_masked'] ?? null,
            'actor_id_hash' => $context['actor_id_hash'] ?? null,
            'http_status' => $context['http_status'] ?? null,
            'raw' => $decoded,
        ];

        $records[] = $record;
    }

    fclose($handle);

    return $records;
}

/**
 * @param list<array<string, mixed>> $rules
 * @param list<array<string, mixed>> $records
 * @return list<array<string, mixed>>
 */
function evaluateRules(array $rules, array $records, DateTimeImmutable $now): array
{
    $alerts = [];

    foreach ($rules as $rule) {
        if (!is_array($rule)) {
            continue;
        }

        $ruleId = (string) ($rule['id'] ?? 'UNKNOWN_RULE');
        $windowMinutes = (int) ($rule['window_minutes'] ?? 5);
        $threshold = (int) ($rule['threshold'] ?? 1);
        $groupBy = (string) ($rule['group_by'] ?? 'global');
        $severity = (string) ($rule['severity'] ?? 'medium');
        $escalation = (string) ($rule['escalation'] ?? 'security-ops');
        $description = (string) ($rule['description'] ?? '');

        $windowStart = $now->sub(new DateInterval(sprintf('PT%dM', max($windowMinutes, 1))));
        $counts = [];

        foreach ($records as $record) {
            if (!recordMatchesRule($record, $rule)) {
                continue;
            }

            $recordAt = parseRecordDatetime($record['datetime'] ?? null);
            if (!$recordAt instanceof DateTimeImmutable) {
                continue;
            }

            if ($recordAt < $windowStart || $recordAt > $now) {
                continue;
            }

            $groupValue = resolveGroupValue($record, $groupBy);
            if (!isset($counts[$groupValue])) {
                $counts[$groupValue] = 0;
            }
            $counts[$groupValue]++;
        }

        foreach ($counts as $groupValue => $count) {
            if ($count < $threshold) {
                continue;
            }

            $alerts[] = [
                'rule_id' => $ruleId,
                'severity' => $severity,
                'escalation' => $escalation,
                'count' => $count,
                'threshold' => $threshold,
                'window_minutes' => $windowMinutes,
                'group' => (string) $groupValue,
                'description' => $description,
                'window_start' => $windowStart->format(DATE_ATOM),
                'window_end' => $now->format(DATE_ATOM),
            ];
        }
    }

    return $alerts;
}

/**
 * @param array<string, mixed> $record
 * @param array<string, mixed> $rule
 */
function recordMatchesRule(array $record, array $rule): bool
{
    $eventId = $record['event_id'] ?? null;
    if (!is_string($eventId) || '' === $eventId) {
        return false;
    }

    $ruleEventIds = $rule['event_ids'] ?? null;
    if (is_array($ruleEventIds) && [] !== $ruleEventIds) {
        $allowed = array_filter($ruleEventIds, 'is_string');
        if (!in_array($eventId, $allowed, true)) {
            return false;
        }
    }

    $eventPrefix = $rule['event_id_prefix'] ?? null;
    if (is_string($eventPrefix) && '' !== $eventPrefix && !str_starts_with($eventId, $eventPrefix)) {
        return false;
    }

    $status = $record['http_status'] ?? null;
    if (isset($rule['min_http_status']) || isset($rule['max_http_status'])) {
        if (!is_int($status) && !is_float($status) && !is_string($status)) {
            return false;
        }

        $statusCode = (int) $status;
        $minStatus = isset($rule['min_http_status']) ? (int) $rule['min_http_status'] : 100;
        $maxStatus = isset($rule['max_http_status']) ? (int) $rule['max_http_status'] : 599;

        if ($statusCode < $minStatus || $statusCode > $maxStatus) {
            return false;
        }
    }

    return true;
}

function parseRecordDatetime(mixed $value): ?DateTimeImmutable
{
    if (!is_string($value) || '' === $value) {
        return null;
    }

    try {
        return new DateTimeImmutable($value);
    } catch (Throwable) {
        return null;
    }
}

/**
 * @param array<string, mixed> $record
 */
function resolveGroupValue(array $record, string $groupBy): string
{
    if ('global' === $groupBy) {
        return 'global';
    }

    $value = $record[$groupBy] ?? null;
    if (!is_string($value) || '' === $value) {
        return 'unknown';
    }

    return $value;
}

/**
 * @param array<string, mixed> $payload
 */
function sendWebhookAlert(string $webhookUrl, array $payload): bool
{
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if (false === $json) {
        return false;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $json,
            'timeout' => 10,
        ],
    ]);

    $result = @file_get_contents($webhookUrl, false, $context);

    return false !== $result;
}
