import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class LeadGridApi implements ICredentialType {
  name = 'leadGridApi';

  displayName = 'LeadGrid API';

  // eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-miscased
  documentationUrl = 'https://leadgrid.io/docs/api';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Create one in LeadGrid under Settings → API. Keys start with lg_live_ (or lg_test_ for sandbox keys). Growth plan required.',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://leadgrid.io',
      description:
        'Override for self-hosted or staging environments. The node appends /api/v1 automatically.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}/api/v1',
      url: '/flows',
      method: 'GET',
    },
  };
}
