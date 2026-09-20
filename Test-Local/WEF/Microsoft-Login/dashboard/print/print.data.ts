import type {
  DashboardPrintTestCase,
} from './print.types';

export const printTestCases: DashboardPrintTestCase[] = [
  {
    testCaseId: 'TC001',
    scenario: 'Print Job Sheet',
    action: 'click',
    locatorIndex: 0,
  },
  {
    testCaseId: 'TC002',
    scenario: 'Export Job Sheet to PDF',
    action: 'download',
    locatorIndex: 1,
  },
  {
    testCaseId: 'TC003',
    scenario: 'Print Compulsory Insurance Table',
    action: 'clickWithClose',
    locatorIndex: 2,
  },
];
