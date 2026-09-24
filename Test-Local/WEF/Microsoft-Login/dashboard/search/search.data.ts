import type { SearchTestCase } from './search.types';

export const searchTestCases: SearchTestCase[] = [
  {
    testCaseId: 'TC001',
    scenario: 'Search by Receipt Number',
    values: [
      'HQ0000020', '', '', '', '', '',
      '', '', '', '', '', '',
    ],
  },
  {
    testCaseId: 'TC002',
    scenario: 'Search by Coverage Start Date',
    values: [
      '', '', '10', '', '', '',
      '', '', '', '', '', '',
    ],
  },
  {
    testCaseId: 'TC003',
    scenario: 'Search by Coverage End Date',
    values: [
      '', '', '', '30', '', '',
      '', '', '', '', '', '',
    ],
  },
  {
    testCaseId: 'TC004',
    scenario: 'Search by Transaction Status',
    values: [
      '', '', '', '', '', '', 'งานใหม่',
      '', '', '', '', '',
    ],
  },
  {
    testCaseId: 'TC005',
    scenario: 'Search by Insured Name',
    values: [
      '', 'Harry', '', '', '', '',
      '', '', '', '', '', '',
    ],
  },
  {
    testCaseId: 'TC006',
    scenario: 'Search by Car Model',
    values: [
      '', '', '', '', '', '',
      '', '', '', '', '', 'E-HS9',
    ],
  },
  {
    testCaseId: 'TC007',
    scenario: 'Search by Chassis Number',
    values: [
      '', '', '', '', '', '',
      '', '', '', '', '1HGBH41JXMN109186', '',
    ],
  },
  {
    testCaseId: 'TC008',
    scenario: 'Search with Multiple Filters',
    values: [
      'HQ0000020', 'Harry', '', '', '', '',
      '', '', '', '', '', '',
    ],
  },
];
