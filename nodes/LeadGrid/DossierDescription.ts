import type { INodeProperties } from 'n8n-workflow';

/**
 * UI schema for the Dossier resource.
 *
 * A "dossier" in LeadGrid is the unified shape behind both a sales lead
 * and a recruitment candidate — same fields, same pipeline, same grid.
 * See https://leadgrid.io/docs/api for the REST reference.
 */

export const dossierOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: { resource: ['dossier'] },
    },
    options: [
      {
        name: 'Archive',
        value: 'archive',
        action: 'Archive a dossier',
        description: 'Soft-delete: sets status to archived',
      },
      {
        name: 'Create',
        value: 'create',
        action: 'Create a dossier',
        description:
          'Create a sales lead or recruitment candidate. Optionally attach a PDF CV in the same call.',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get a dossier',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        action: 'Get many dossiers',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a dossier',
      },
      {
        name: 'Upload CV',
        value: 'uploadCv',
        action: 'Upload a CV to a dossier',
        description: 'Attach a PDF CV to an existing dossier',
      },
    ],
    default: 'create',
  },
];

export const dossierFields: INodeProperties[] = [
  // ========= CREATE =========
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    required: true,
    displayOptions: { show: { resource: ['dossier'], operation: ['create'] } },
    options: [
      { name: 'Candidate', value: 'candidate' },
      { name: 'Sales Lead', value: 'sales' },
    ],
    default: 'candidate',
    description: 'Whether this dossier is a recruitment candidate or a sales lead',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    displayOptions: { show: { resource: ['dossier'], operation: ['create'] } },
    default: '',
    description: 'Candidate full name, or deal / account name for a sales lead',
  },
  {
    displayName: 'Attach CV',
    name: 'attachCv',
    type: 'boolean',
    displayOptions: { show: { resource: ['dossier'], operation: ['create'] } },
    default: false,
    description:
      'Whether to attach a PDF CV in the same call. If enabled and the upload fails, the dossier is rolled back.',
  },
  {
    displayName: 'CV Binary Property',
    name: 'cvBinaryProperty',
    type: 'string',
    required: true,
    displayOptions: {
      show: { resource: ['dossier'], operation: ['create'], attachCv: [true] },
    },
    default: 'data',
    description: 'Name of the input binary property that holds the PDF (defaults to "data")',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: { show: { resource: ['dossier'], operation: ['create'] } },
    default: {},
    options: [
      {
        displayName: 'Assigned To (User ID)',
        name: 'assigned_to',
        type: 'string',
        default: '',
        description: 'UUID of the organization member to assign the dossier to',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
        description: 'Candidate: city of residence. Sales: city of the account.',
      },
      {
        displayName: 'Company',
        name: 'company',
        type: 'string',
        default: '',
        description: 'Candidate: current employer. Sales: target company.',
      },
      {
        displayName: 'Contact Person',
        name: 'contact_person',
        type: 'string',
        default: '',
        description: 'Sales only. Named contact at the target company.',
      },
      {
        displayName: 'Deal Currency',
        name: 'deal_currency',
        type: 'string',
        default: 'EUR',
        description: 'Sales only. ISO 4217 currency code.',
      },
      {
        displayName: 'Deal Size',
        name: 'deal_size',
        type: 'number',
        default: 0,
        description: 'Sales only. Expected contract value.',
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        default: '',
      },
      {
        displayName: 'Flow Name or ID',
        name: 'flow_id',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getFlows' },
        default: '',
        description:
          'Flow this dossier belongs to. Defaults to your default flow for the chosen type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Intake Notes',
        name: 'intake_notes',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
      },
      {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Role',
        name: 'role',
        type: 'string',
        default: '',
        description: 'Candidate: role applied for. Sales: role of the contact.',
      },
    ],
  },

  // ========= GET / UPDATE / ARCHIVE / UPLOAD CV — shared Dossier ID =========
  {
    displayName: 'Dossier ID',
    name: 'dossierId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['dossier'],
        operation: ['get', 'update', 'archive', 'uploadCv'],
      },
    },
    default: '',
  },

  // ========= GET MANY =========
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: { show: { resource: ['dossier'], operation: ['getAll'] } },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: { resource: ['dossier'], operation: ['getAll'], returnAll: [false] },
    },
    typeOptions: { minValue: 1 },
    default: 50,
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    displayOptions: { show: { resource: ['dossier'], operation: ['getAll'] } },
    default: {},
    options: [
      {
        displayName: 'Stage ID',
        name: 'stage_id',
        type: 'string',
        default: '',
        description: 'Only return dossiers currently on this stage',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Active', value: 'active' },
          { name: 'Archived', value: 'archived' },
          { name: 'Lost', value: 'lost' },
          { name: 'Won', value: 'won' },
        ],
        default: 'active',
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'options',
        options: [
          { name: 'Candidate', value: 'candidate' },
          { name: 'Sales Lead', value: 'sales' },
        ],
        default: 'candidate',
      },
    ],
  },

  // ========= UPDATE =========
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    displayOptions: { show: { resource: ['dossier'], operation: ['update'] } },
    default: {},
    options: [
      {
        displayName: 'Assigned To (User ID)',
        name: 'assigned_to',
        type: 'string',
        default: '',
      },
      {
        displayName: 'City',
        name: 'city',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Company',
        name: 'company',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Contact Person',
        name: 'contact_person',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Current Stage ID',
        name: 'current_stage_id',
        type: 'string',
        default: '',
        description: 'Move the dossier to this stage. Triggers a dossier.stage_changed webhook.',
      },
      {
        displayName: 'Deal Currency',
        name: 'deal_currency',
        type: 'string',
        default: 'EUR',
      },
      {
        displayName: 'Deal Size',
        name: 'deal_size',
        type: 'number',
        default: 0,
      },
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        default: '',
      },
      {
        displayName: 'Intake Notes',
        name: 'intake_notes',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Phone',
        name: 'phone',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Role',
        name: 'role',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Active', value: 'active' },
          { name: 'Archived', value: 'archived' },
          { name: 'Lost', value: 'lost' },
          { name: 'Won', value: 'won' },
        ],
        default: 'active',
      },
    ],
  },

  // ========= UPLOAD CV =========
  {
    displayName: 'CV Binary Property',
    name: 'cvBinaryProperty',
    type: 'string',
    required: true,
    displayOptions: {
      show: { resource: ['dossier'], operation: ['uploadCv'] },
    },
    default: 'data',
    description: 'Name of the input binary property that holds the PDF',
  },
];
