import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Thin wrapper around n8n's httpRequestWithAuthentication that:
 *  - prepends the LeadGrid /api/v1 prefix
 *  - wraps any error as a NodeApiError so n8n renders a clean message
 *  - exposes the `data` envelope from LeadGrid responses
 *
 * All endpoints return either `{ data: ... }` (single) or
 * `{ data: [...], meta: {...} }` (list). The caller handles that shape.
 */
export async function leadGridApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject | Buffer,
  qs?: IDataObject,
  overrides: Partial<IHttpRequestOptions> = {},
): Promise<unknown> {
  const credentials = (await this.getCredentials('leadGridApi')) as {
    baseUrl?: string;
  };
  const baseUrl = (credentials.baseUrl ?? 'https://leadgrid.io').replace(/\/$/, '');

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}/api/v1${endpoint}`,
    json: true,
    ...overrides,
  };
  if (body !== undefined) options.body = body as IDataObject;
  if (qs !== undefined) options.qs = qs;

  try {
    return await this.helpers.httpRequestWithAuthentication.call(
      this,
      'leadGridApi',
      options,
    );
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}

/**
 * Load-options helper that fetches all flows for the authenticated org and
 * renders them as a dropdown, optionally filtered by type.
 *
 * n8n calls this when the user opens the "Flow" dropdown in the UI so they
 * don't need to paste UUIDs.
 */
export async function loadFlows(
  this: ILoadOptionsFunctions,
  type?: 'candidate' | 'sales',
): Promise<INodePropertyOptions[]> {
  const qs: IDataObject = {};
  if (type) qs.type = type;

  const response = (await leadGridApiRequest.call(this, 'GET', '/flows', undefined, qs)) as {
    data?: Array<{ id: string; name: string; type: string; is_default: boolean }>;
  };

  return (response.data ?? []).map((f) => ({
    name: `${f.name}${f.is_default ? ' (default)' : ''}`,
    value: f.id,
    description: `Type: ${f.type}`,
  }));
}

/**
 * Load-options helper that fetches the stages of a specific flow.
 * Used by the "Move to Stage" convenience operation.
 */
export async function loadStagesForFlow(
  this: ILoadOptionsFunctions,
  flowId: string,
): Promise<INodePropertyOptions[]> {
  if (!flowId) return [];
  const response = (await leadGridApiRequest.call(
    this,
    'GET',
    `/flows/${flowId}/stages`,
  )) as { data?: Array<{ id: string; name: string; position: number }> };

  return (response.data ?? []).map((s) => ({
    name: `${s.position}. ${s.name}`,
    value: s.id,
  }));
}
