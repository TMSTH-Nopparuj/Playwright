import { expect, Page } from '@playwright/test';

import type {
  DashboardPrintAction,
  DashboardPrintTestCase,
} from './print.types';

const locators: Array<(page: Page) => Promise<void>> = [
  async (page: Page): Promise<void> => {
    await page
      .getByRole('button', {
        name: 'ปริ้นท์ พ.ร.บ',
      })
      .first()
      .click();
  },
  async (page: Page): Promise<void> => {
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: ' Export Excel',
      })
      .click();
    await downloadPromise;
  },
  async (page: Page): Promise<void> => {
    await page
      .getByRole('button', {
        name: 'ปริ้นท์ พ.ร.บ',
      })
      .first()
      .click();

    const closeButton = page.getByRole('button', {
      name: 'Close',
      exact: true,
    });

    await expect(closeButton).toBeVisible({
      timeout: 10_000,
    });

    await closeButton.click();
  },
];

async function applyAction(
  page: Page,
  action: DashboardPrintAction,
  locatorIndex: number
): Promise<void> {
  const locator = locators[locatorIndex];

  if (!locator) {
    throw new Error(
      `No locator configured for index ${locatorIndex}`
    );
  }

  switch (action) {
    case 'click': {
      await locator(page);
      break;
    }

    case 'download': {
      const downloadPromise = page.waitForEvent('download');
      await locator(page);
      await downloadPromise;
      break;
    }

    case 'clickWithClose': {
      await locator(page);
      break;
    }

    default: {
      const _exhaustive: never = action;
      throw new Error(
        `Unhandled DashboardPrintAction: ${String(_exhaustive)}`
      );
    }
  }
}

export async function applyPrintAction(
  page: Page,
  testData: DashboardPrintTestCase
): Promise<void> {
  await applyAction(
    page,
    testData.action,
    testData.locatorIndex
  );
}
