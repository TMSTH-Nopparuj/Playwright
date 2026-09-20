import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import type {
  DashboardSearchControl,
  DashboardSearchTestCase,
} from './search.types';

function getIndexedControl(
  controls: Locator,
  controlIndex: number
): Locator {
  if (
    !Number.isInteger(controlIndex) ||
    controlIndex < 0
  ) {
    throw new Error(
      `Invalid control index: ${controlIndex}`
    );
  }

  return controlIndex === 0
    ? controls.first()
    : controls.nth(controlIndex);
}

/**
 * Guard: value ต้องไม่เป็น empty string สำหรับ dropdown-type controls
 *
 * เหตุผล:
 * page.getByRole('option', { name: '', exact: false })
 * → empty string เป็น substring ของทุก string
 * → แมทช์ทุก option บนหน้า
 * → strict mode violation
 *
 * ถ้าเจตนาทดสอบ "ไม่เลือก option" ให้ใช้ flow อื่น
 * (เช่น ไม่เรียก applyControl แล้วไป verify state โดยตรง)
 */
function assertDropdownValueNotEmpty(
  controlType: string,
  value: string
): void {
  if (value === '') {
    throw new Error(
      [
        `${controlType}: value cannot be empty.`,
        `Empty string matches ALL options (strict mode violation).`,
        `Provide the explicit option text (e.g., 'E-HS9', '(All)').`,
        `If you want to test "no selection", use a different flow.`,
      ].join('\n')
    );
  }
}

async function applyControl(
  page: Page,
  controlData: DashboardSearchControl
): Promise<void> {
  switch (controlData.controlType) {
    case 'textbox': {
      const textboxes =
        page.getByRole('textbox');

      const textbox = getIndexedControl(
        textboxes,
        controlData.controlIndex
      );

      await expect(textbox).toBeVisible({
        timeout: 30_000,
      });

      await textbox.click();
      await textbox.fill(controlData.value);

      await expect(textbox).toHaveValue(
        controlData.value
      );

      break;
    }

    case 'dateTextbox': {
      const dateTextboxes = page.getByRole(
        'textbox',
        {
          name: 'DD/MM/YYYY',
        }
      );

      const dateTextbox = getIndexedControl(
        dateTextboxes,
        controlData.controlIndex
      );

      await expect(dateTextbox).toBeVisible({
        timeout: 30_000,
      });

      await dateTextbox.click();
      await dateTextbox.fill(
        controlData.value
      );

      await dateTextbox.press('Tab');

      await expect(dateTextbox).toHaveValue(
        controlData.value
      );

      break;
    }

    case 'namedTextbox': {
      const textbox = page.getByRole(
        'textbox',
        {
          name: controlData.accessibleName,
          exact: false,
        }
      );

      // Guard: ให้ error message ที่บอกวิธีแก้เมื่อหาไม่เจอ
      try {
        await expect(textbox).toBeVisible({
          timeout: 30_000,
        });
      } catch (error) {
        const originalMessage =
          error instanceof Error
            ? error.message
            : String(error);

        throw new Error(
          [
            `namedTextbox not found: accessibleName='${controlData.accessibleName}'`,
            ``,
            `Possible causes:`,
            `  1. Field has no accessible name on this page`,
            `     (codegen shows getByRole('textbox').nth(N) instead of by name)`,
            `  2. Label text does not match — check whitespace, slashes, Thai chars`,
            `  3. Field is not yet rendered — check page state`,
            ``,
            `Suggestions:`,
            `  - Verify actual label in _locators/<feature>.ts`,
            `  - If field is index-based, use controlType: 'textbox' with controlIndex: N`,
            ``,
            `Original error:`,
            originalMessage,
          ].join('\n')
        );
      }

      await textbox.click();
      await textbox.fill(controlData.value);

      await expect(textbox).toHaveValue(
        controlData.value
      );

      break;
    }

    case 'dropdown': {
      // Guard: empty value ทำให้ option filter จับทุกตัว
      assertDropdownValueNotEmpty(
        'dropdown',
        controlData.value
      );

      const dropdowns = page.locator(
        [
          '.ng-select-searchable',
          '> .ng-select-container',
          '> .ng-arrow-wrapper',
        ].join(' ')
      );

      const dropdown = getIndexedControl(
        dropdowns,
        controlData.controlIndex
      );

      await expect(dropdown).toBeVisible({
        timeout: 30_000,
      });

      await dropdown.click();

      const option = page.getByRole('option', {
        name: controlData.value,
        exact: false,
      });

      await expect(option).toBeVisible({
        timeout: 10_000,
      });

      await option.click();

      break;
    }

    case 'namedDropdown': {
      // Guard: empty value ทำให้ option filter จับทุกตัว
      assertDropdownValueNotEmpty(
        'namedDropdown',
        controlData.value
      );

      const dropdown = page
        .locator('ng-select')
        .filter({
          hasText: controlData.dropdownText,
        })
        .getByRole('combobox');

      await expect(dropdown).toBeVisible({
        timeout: 30_000,
      });

      await dropdown.click();

      const option = page.getByRole('option', {
        name: controlData.value,
        exact: false,
      });

      await expect(option).toBeVisible({
        timeout: 10_000,
      });

      await option.click();

      break;
    }

    default: {
      const unsupportedControl: never =
        controlData;

      throw new Error(
        `Unsupported control: ${JSON.stringify(
          unsupportedControl
        )}`
      );
    }
  }
}

export async function applySearchControl(
  page: Page,
  testData: DashboardSearchTestCase
): Promise<void> {
  await applyControl(
    page,
    testData.control
  );

  console.log(
    [
      'Applied search control',
      `controlType=${testData.control.controlType}`,
      `value=${testData.control.value}`,
    ].join(', ')
  );
}