import { test, expect } from '@playwright/test';

test('mvp critical flow: login -> list -> detail -> logout', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible();

  await page.getByLabel('Email 或手機').fill('demo@example.com');
  await page.getByLabel('密碼').fill('password123');
  await page.getByRole('button', { name: '送出登入' }).click();

  await expect(page.getByRole('heading', { name: '餐廳列表' })).toBeVisible();

  await page.getByRole('link').first().click();
  await expect(page.getByRole('heading', { name: '餐廳詳情' })).toBeVisible();

  await page.getByRole('button', { name: '返回列表' }).click();
  await page.getByRole('button', { name: '登出' }).click();

  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible();
});

