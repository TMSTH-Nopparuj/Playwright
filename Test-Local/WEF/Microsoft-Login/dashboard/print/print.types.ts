export type DashboardPrintControl = {
  controlType: 'textbox';
  controlIndex: number;
  value: string;
};

export interface DashboardPrintTestCase {
  testCaseId: string;
  scenario: string;

  control: DashboardPrintControl;

  runInitialSearch?: boolean;
  expectedText?: string;
}
