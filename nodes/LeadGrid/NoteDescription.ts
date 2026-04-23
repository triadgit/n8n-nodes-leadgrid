import type { INodeProperties } from 'n8n-workflow';

export const noteOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['note'] } },
    options: [
      {
        name: 'Add',
        value: 'add',
        action: 'Add a note to a dossier',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many notes for a dossier',
      },
    ],
    default: 'add',
  },
];

export const noteFields: INodeProperties[] = [
  {
    displayName: 'Dossier ID',
    name: 'dossierId',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['note'] } },
    default: '',
  },
  {
    displayName: 'Content',
    name: 'content',
    type: 'string',
    required: true,
    typeOptions: { rows: 4 },
    displayOptions: { show: { resource: ['note'], operation: ['add'] } },
    default: '',
  },
  {
    displayName: 'Internal',
    name: 'is_internal',
    type: 'boolean',
    displayOptions: { show: { resource: ['note'], operation: ['add'] } },
    default: true,
    description:
      'Whether the note is only visible to organization members. Uncheck to make it visible to the candidate or client.',
  },
];
