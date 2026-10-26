<?php

namespace App\Tests\Api;

use Symfony\Bundle\FrameworkBundle\KernelBrowser;

/**
 * Login helpers shared by the API integration tests.
 *
 * LoginCsrfRequestSubscriber rejects every unsafe /api request that carries
 * neither a CSRF token nor a Bearer token, and /api/login is not on its exempt
 * list, so logging in has to fetch a token first. Four of the five test cases
 * posted credentials without one and would have been answered 403; only
 * AdminExportControllerTest did it correctly. That is the same drift between
 * copies that left the database guard calling a protected method.
 */
trait AuthenticatesThroughTheApi
{
    private function fetchCsrfToken(KernelBrowser $client): string
    {
        $client->request('GET', '/api/csrf/token');
        self::assertResponseStatusCodeSame(200);

        $payload = json_decode((string) $client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayHasKey('csrfToken', $payload);
        self::assertIsString($payload['csrfToken']);

        return $payload['csrfToken'];
    }

    private function loginAndGetToken(KernelBrowser $client, string $email, string $plainPassword): string
    {
        // Tokens are single-use, so this fetches one per login.
        $client->jsonRequest('POST', '/api/login', [
            'email'    => $email,
            'password' => $plainPassword,
        ], [
            'HTTP_X_CSRF_TOKEN' => $this->fetchCsrfToken($client),
        ]);

        self::assertResponseStatusCodeSame(200);

        $payload = json_decode((string) $client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayHasKey('token', $payload);
        self::assertIsString($payload['token']);

        return $payload['token'];
    }
}
