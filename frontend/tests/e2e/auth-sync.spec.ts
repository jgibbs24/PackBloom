import { expect, test } from '@playwright/test';

test('registers, shows profile, syncs account save, and signs out', async ({ page }) => {
  const user = {
    displayName: 'E2E Player',
    email: `e2e-${Date.now()}@packbloom.test`,
    id: 'user-e2e',
  };
  const authResponse = {
    token: 'token-e2e',
    user,
  };
  let savedSessionId = 'session-e2e';
  let savedSessionState: unknown = null;

  await page.route('**://*/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/auth/register' || path === '/api/auth/login') {
      await route.fulfill({ json: authResponse });
      return;
    }

    if (path === '/api/auth/logout') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (path === '/api/auth/me') {
      await route.fulfill({ json: user });
      return;
    }

    if (path === '/api/health') {
      await route.fulfill({ json: { status: 'ok' } });
      return;
    }

    if (path === '/api/sets') {
      await route.fulfill({
        json: [{
          msrpUsd: 5.99,
          packType: 'play-booster-barebones',
          setCode: 'blb',
          setName: 'Bloomburrow',
        }],
      });
      return;
    }

    if (path === '/api/sessions/current') {
      await route.fulfill({ status: 404, json: { code: 'SAVED_SESSION_NOT_FOUND' } });
      return;
    }

    if (path === '/api/battle-sessions/current') {
      await route.fulfill({ status: 404, json: { code: 'SAVED_BATTLE_SESSION_NOT_FOUND' } });
      return;
    }

    if (path === '/api/sessions' && request.method() === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}') as { state?: unknown };
      savedSessionState = body.state;
      await route.fulfill({
        status: 201,
        json: {
          createdAt: new Date().toISOString(),
          displayName: 'PackBloom Session',
          id: savedSessionId,
          state: savedSessionState,
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (path === `/api/sessions/${savedSessionId}` && request.method() === 'PUT') {
      const body = JSON.parse(request.postData() ?? '{}') as { state?: unknown };
      savedSessionState = body.state;
      await route.fulfill({
        json: {
          createdAt: new Date().toISOString(),
          displayName: 'PackBloom Session',
          id: savedSessionId,
          state: savedSessionState,
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    if (path.endsWith('/warmup')) {
      await route.fulfill({
        json: {
          boosterType: 'play',
          loadedPools: 4,
          setCode: 'blb',
          status: 'ready',
          totalPools: 4,
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Unhandled test route: ${path}` } });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByLabel('Display name').fill(user.displayName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('button', { name: user.displayName })).toBeVisible();

  await page.getByRole('button', { name: user.displayName }).click();
  await expect(page.getByText('Account', { exact: true })).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
  await expect(page.getByText('Account sync is enabled')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
