import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import type {
  DashboardPrintControl,
} from './print.types';

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

function assertDropdownValueNotEmpty(
  controlType: string,
  value: string
): void {
  if (value === '') {
    throw new Error(
      [
        `${controlType}: value cannot be empty.`,
        `Empty string matches ALL options (strict mode violation).`,
        `Provide the explicit option text (e.g., 'งานใหม่', '(All)').`,
      ].join('\n')
    );
  }
}

async function applyControl(
  page: Page,
  controlData: DashboardPrintControl
): Promise<void> {
  switch (controlData.controlType) {
    case 'textbox': {
      const textboxes = page.getByRole('textbox');
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

    default: {
      const _exhaustive: never =
        controlData as never;

      throw new Error(
        `Unhandled DashboardPrintControl: ${JSON.stringify(controlData)}`
      );
    }
  }
}

export async function applyPrintControl(
  page: Page,
  testData: { control: DashboardPrintControl }
): Promise<void> {
  await applyControl(page, testData.control);
}

export function assertPrintDropdownValueNotEmpty(
  value: string
): void {
  assertDropdownValueNotEmpty(
    'dropdown',
    value
  );
}

export function assertNamedControlVisible(
  locator: Locator,
  accessibleName: string
): Promise<void> {
  return expect(locator, `named control not found: ${accessibleName}`).toBeVisible({
    timeout: 30_000,
  });
}
