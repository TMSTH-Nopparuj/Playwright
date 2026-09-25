import { Page } from '@playwright/test';

import type { SearchTestCase } from './search.types';
import { searchLocators } from '../_locators/search';

async function applyItem(
  page: Page,
  index: number,
  item: string
): Promise<void> {
  const locatorFn = searchLocators[index];

  if (!locatorFn) {
    throw new Error(`No locator at index ${index}`);
  }

  const target = locatorFn(page);

  if (item.startsWith('|')) {
    const action = item.slice(1);

    switch (action) {
      case 'click':
        await target.click();
        return;
      default:
        throw new Error(`Unknown action: |${action}`);
    }
  }

  const locatorCode = locatorFn.toString();

  if (
    locatorCode.includes("getByRole('textbox'") ||
    locatorCode.includes('getByRole("textbox"')
  ) {
    await target.fill(item);
  } else if (
    locatorCode.includes("getByRole('combobox'") ||
    locatorCode.includes('getByRole("combobox"') ||
    locatorCode.includes('ng-select')
  ) {
    await target.click();
    await page.getByRole('option', { name: item }).click();
  } else {
    throw new Error(
      `Cannot dispatch text value at index ${index} — ` +
        `unknown locator type. Locator: ${locatorCode}`
    );
  }
}

export async function applySearchInputs(
  page: Page,
  testData: SearchTestCase
): Promise<void> {
  const bound = Math.min(testData.values.length, searchLocators.length);

  for (let i = 0; i < bound; i++) {
    const item = testData.values[i];

    if (item === '') {
      continue;
    }

    await applyItem(page, i, item);
  }
}
