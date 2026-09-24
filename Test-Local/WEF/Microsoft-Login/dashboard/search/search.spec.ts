import { expect, Page, test } from '@playwright/test';

import { searchTestCases } from './search.data';
import { applySearchInputs } from './search.helper';

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

async function enterSearchPage(page: Page): Promise<void> {
  await page.goto(APPLICATION_URL);
  await page.getByText('TMSTH Staff สำหรับพนักงานบริษัท').click();
  await page.locator('.ng-input').click();
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

test.describe('Dashboard Search', () => {
  test.beforeEach(async ({ page }) => {
    await enterSearchPage(page);
  });

  for (const testData of searchTestCases) {
    test(
      `${testData.testCaseId} - ${testData.scenario}`,
      async ({ page }) => {
        await page.getByRole('button', { name: ' ล้างค่า' }).click();
        await page.getByRole('button', { name: ' ค้นหา' }).click();

        await applySearchInputs(page, testData);

        await page.getByRole('button', { name: ' ค้นหา' }).click();
        await defaultVerify(page);
      }
    );
  }
});
