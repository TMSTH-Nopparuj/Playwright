import type { PrintTestCase } from './print.types';

export const printTestCases: PrintTestCase[] = [
  {
    testCaseId: 'TC001',
    scenario: 'Print Job Sheet',
    values: ['|click', '', ''],
  },
  {
    testCaseId: 'TC002',
    scenario: 'Export Job Sheet to PDF',
    values: ['', '|click', ''],
  },
  {
    testCaseId: 'TC003',
    scenario: 'Print Compulsory Insurance Table',
    values: ['', '', '|click'],
  },
];
