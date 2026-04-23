import type { INodeProperties } from 'n8n-workflow';

export const flowOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['flow'] } },
    options: [
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many flows',
      },
      {
        name: 'Get Stages',
        value: 'getStages',
        action: 'Get the stages of a flow',
      },
    ],
    default: 'getAll',
  },
];

export const flowFields: INodeProperties[] = [
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    displayOptions: { show: { resource: ['flow'], operation: ['getAll'] } },
    options: [
      { name: 'Any', value: '' },
      { name: 'Candidate', value: 'candidate' },
      { name: 'Sales', value: 'sales' },
    ],
    default: '',
    description: 'Filter flows by type',
  },
  {
    displayName: 'Flow ID',
    name: 'flowId',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['flow'], operation: ['getStages'] } },
    default: '',
  },
];
