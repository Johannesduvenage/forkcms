<?php

namespace Backend\Core\Tests;

use Common\WebTestCase;
use Symfony\Bundle\FrameworkBundle\Client;

abstract class BackendWebTestCase extends WebTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!defined('APPLICATION')) {
            define('APPLICATION', 'Backend');
        }
    }

    protected function assertAuthenticationIsNeeded(Client $client, string $url, string $method = 'GET'): void
    {
        // make sure we aren't logged in with the client
        $this->logout($client);

        $this->assertGetsRedirected(
            $client,
            $url,
            '/private/en/authentication?querystring=' . rawurlencode($url),
            $method
        );
    }
}
