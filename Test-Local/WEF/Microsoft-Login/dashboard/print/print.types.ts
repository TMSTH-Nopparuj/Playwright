export type DashboardPrintAction =
  | 'click'
  | 'download'
  | 'clickWithClose';

export interface DashboardPrintTestCase {
  testCaseId: string;
  scenario: string;
  action: DashboardPrintAction;
  locatorIndex: number;
}
