import { expect, Page, test } from '@playwright/test';

import { printTestCases } from './print.data';
import { applyPrintInputs } from './print.helper';

const APPLICATION_URL =
  'https://apps-uat.tokiomarinesafety.co.th/wfe/';

async function waitForLoading(page: Page): Promise<void> {
  const loadingBackdrop = page.locator('.loading-backdrop');

  if (await loadingBackdrop.count()) {
    await expect(loadingBackdrop).toBeHidden({
      timeout: 30_000,
    });
  }
}

async function enterPrintPage(page: Page): Promise<void> {
  await page.goto(APPLICATION_URL);
  await page.getByText('TMSTH Staff สำหรับพนักงานบริษัท').click();
  await page.locator('span').first().click();
  await page.getByRole('option', { name: 'Hongqi' }).click();
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await waitForLoading(page);
}

async function defaultVerify(page: Page): Promise<void> {
  const errorDialog = page
    .locator('[role="dialog"], .modal, .swal2-popup')
    .filter({
      hasText: /error|ผิดพลาด|เกิดข้อผิดพลาด/i,
    });

  await expect(errorDialog).toHaveCount(0, {
    timeout: 10_000,
  });

  await expect(page).toHaveURL(/dashboard/i, {
    timeout: 10_000,
  });
}

test.describe('Dashboard Print', () => {
  test.beforeEach(async ({ page }) => {
    await enterPrintPage(page);
  });

  for (const testData of printTestCases) {
    test(`${testData.testCaseId} - ${testData.scenario}`, async ({ page }) => {
      await page.getByRole('button', { name: ' ล้างค่า' }).click();
      await page.getByRole('button', { name: ' ค้นหา' }).click();

      await applyPrintInputs(page, testData);

      await defaultVerify(page);
    });
  }
});
