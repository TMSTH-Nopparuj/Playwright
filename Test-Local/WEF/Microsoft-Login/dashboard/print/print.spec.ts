import {
  expect,
  Page,
  test,
} from '@playwright/test';

import {
  printTestCases,
} from './print.data';

import {
  applyPrintControl,
} from './print.helper';

import {
  verifyNavigatedTo,
} from '../../../_shared/verify-helpers';

const APPLICATION_URL =
  'https://apps-uat.tokiomarinesafety.co.th/wfe/';

async function waitForLoading(
  page: Page
): Promise<void> {
  const loadingBackdrop = page.locator(
    '.loading-backdrop'
  );

  if (await loadingBackdrop.count()) {
    await expect(loadingBackdrop).toBeHidden({
      timeout: 30_000,
    });
  }
}

async function enterWefDashboard(
  page: Page
): Promise<void> {
  await page.goto(APPLICATION_URL);

  await page
    .getByText(
      'TMSTH Staff สำหรับพนักงานบริษัท',
      { exact: true }
    )
    .click();

  await page.locator('span').first().click();

  await page
    .getByRole('option', {
      name: 'Hongqi',
      exact: true,
    })
    .click();

  await page
    .getByRole('button', {
      name: 'เข้าสู่ระบบ',
    })
    .click();

  await waitForLoading(page);

  await verifyNavigatedTo(page, {
    urlPattern: /dashboard/i,
    actionContext: 'After login to dashboard',
    timeout: 30_000,
  });
}

async function clearPrintFilters(
  page: Page
): Promise<void> {
  const clearButton = page.getByRole('button', {
    name: /ล้างค่า/,
  });

  await expect(clearButton).toBeVisible({
    timeout: 10_000,
  });

  await clearButton.click();

  await waitForLoading(page);
}

async function clickSearch(
  page: Page
): Promise<void> {
  const searchButton = page.getByRole('button', {
    name: /ค้นหา/,
  });

  await expect(searchButton).toBeVisible({
    timeout: 10_000,
  });

  await searchButton.click();

  await waitForLoading(page);
}

async function openWorkOrderRow(
  page: Page
): Promise<void> {
  const workOrderButton = page
    .getByRole('button', {
      name: 'ใบแจ้งงาน',
    })
    .first();

  await expect(workOrderButton).toBeVisible({
    timeout: 10_000,
  });

  await workOrderButton.click();

  await waitForLoading(page);
}

async function closePrintDialog(
  page: Page
): Promise<void> {
  const closeButton = page.getByRole('button', {
    name: 'ปิด',
    exact: true,
  });

  const closeVisible = await closeButton
    .isVisible({ timeout: 5_000 })
    .catch(() => false);

  if (closeVisible) {
    await closeButton.click();
    await expect(closeButton).toBeHidden({
      timeout: 10_000,
    });
  }
}

async function printWorkOrder(
  page: Page
): Promise<void> {
  const printButton = page
    .getByRole('button', {
      name: 'ปริ้นท์ พ.ร.บ',
    })
    .first();

  await expect(printButton).toBeVisible({
    timeout: 10_000,
  });

  await printButton.click();

  await page
    .getByRole('button', {
      name: 'Close',
      exact: true,
    })
    .click();

  await waitForLoading(page);
}

test.describe('Dashboard Print', () => {
  test.beforeEach(async ({ page }) => {
    await enterWefDashboard(page);
  });

  for (const testData of printTestCases) {
    test(`${testData.testCaseId} - ${testData.scenario}`, async ({ page }) => {
      await test.step('Clear print filters', async () => {
        await clearPrintFilters(page);
      });

      if (testData.runInitialSearch) {
        await test.step('Run initial search', async () => {
          await clickSearch(page);
        });
      }

      await test.step('Apply print control', async () => {
        await applyPrintControl(page, testData);
      });

      await test.step('Open work order and print', async () => {
        await openWorkOrderRow(page);
        await closePrintDialog(page);
        await printWorkOrder(page);
      });

      await test.step('Verify dashboard ready', async () => {
        await verifyNavigatedTo(page, {
          urlPattern: /dashboard/i,
          actionContext: 'After print workflow',
        });
      });
    });
  }
});
