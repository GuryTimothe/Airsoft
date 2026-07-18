<?php

namespace App\Tests\Security;

use PHPUnit\Framework\TestCase;

final class SecurityAlertCheckTest extends TestCase
{
    public function testCriticalJwtRevocationErrorTriggersExpectedAlert(): void
    {
        $tempLogFile = $this->createTempLogFile([
            $this->buildSecurityLogLine(
                eventId: 'SEC.JWT.REVOCATION_ERROR',
                actorIdHash: 'actor-hash-1',
                sourceIpMasked: '198.51.100.0/24',
                httpStatus: 503,
                at: (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format(DATE_ATOM),
            ),
        ]);

        [$exitCode, $output] = $this->runAlertCheck($tempLogFile);

        @unlink($tempLogFile);

        $this->assertSame(2, $exitCode, $output);
        $this->assertStringContainsString('JWT_REVOCATION_ERROR_ANY', $output);
        $this->assertStringContainsString('"severity":"critical"', $output);
    }

    public function testNoAlertWhenThresholdIsNotReached(): void
    {
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));

        $lines = [
            $this->buildSecurityLogLine(
                eventId: 'SEC.AUTH.LOGIN_FAILED',
                actorIdHash: 'actor-hash-2',
                sourceIpMasked: '203.0.113.0/24',
                httpStatus: 401,
                at: $now->format(DATE_ATOM),
            ),
        ];

        $tempLogFile = $this->createTempLogFile($lines);

        [$exitCode, $output] = $this->runAlertCheck($tempLogFile);

        @unlink($tempLogFile);

        $this->assertSame(0, $exitCode, $output);
        $this->assertStringContainsString('No security alerts triggered', $output);
    }

    /**
     * @param list<string> $lines
     */
    private function createTempLogFile(array $lines): string
    {
        $path = tempnam(sys_get_temp_dir(), 'security-log-');
        self::assertNotFalse($path);

        file_put_contents($path, implode(PHP_EOL, $lines).PHP_EOL);

        return $path;
    }

    /**
     * @return array{0:int,1:string}
     */
    private function runAlertCheck(string $logFile): array
    {
        $projectRoot = dirname(__DIR__, 2);
        $scriptPath = $projectRoot.'/bin/security_alert_check.php';
        $rulesPath = $projectRoot.'/config/security_alert_rules.yaml';

        $command = sprintf(
            'php %s --file=%s --rules=%s 2>&1',
            escapeshellarg($scriptPath),
            escapeshellarg($logFile),
            escapeshellarg($rulesPath),
        );

        $outputLines = [];
        $exitCode = 0;
        exec($command, $outputLines, $exitCode);

        return [$exitCode, implode(PHP_EOL, $outputLines)];
    }

    private function buildSecurityLogLine(
        string $eventId,
        string $actorIdHash,
        string $sourceIpMasked,
        int $httpStatus,
        string $at,
    ): string {
        $payload = [
            'message' => 'Security test event',
            'context' => [
                'event_id' => $eventId,
                'event_category' => 'security_test',
                'severity' => 'WARNING',
                'outcome' => 'failure',
                'action' => 'test',
                'service' => 'backend-api',
                'environment' => 'test',
                'actor_type' => 'user',
                'actor_id_hash' => $actorIdHash,
                'source_ip_masked' => $sourceIpMasked,
                'http_status' => $httpStatus,
            ],
            'level' => 300,
            'level_name' => 'WARNING',
            'channel' => 'security',
            'datetime' => $at,
            'extra' => [],
        ];

        return (string) json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}
