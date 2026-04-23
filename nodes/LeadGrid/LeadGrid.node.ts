import type {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { leadGridApiRequest, loadFlows } from './GenericFunctions';
import { dossierFields, dossierOperations } from './DossierDescription';
import { noteFields, noteOperations } from './NoteDescription';
import { flowFields, flowOperations } from './FlowDescription';

type DossierCreateBody = {
  type: 'candidate' | 'sales';
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  company?: string | null;
  role?: string | null;
  contact_person?: string | null;
  flow_id?: string | null;
  assigned_to?: string | null;
  intake_notes?: string | null;
  deal_size?: number | null;
  deal_currency?: string | null;
};

export class LeadGrid implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'LeadGrid',
    name: 'leadGrid',
    // eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
    icon: 'file:leadGrid.png',
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Create and manage dossiers (candidates and sales leads) in LeadGrid',
    defaults: {
      name: 'LeadGrid',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'leadGridApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Dossier', value: 'dossier' },
          { name: 'Note', value: 'note' },
          { name: 'Flow', value: 'flow' },
        ],
        default: 'dossier',
      },

      ...dossierOperations,
      ...dossierFields,
      ...noteOperations,
      ...noteFields,
      ...flowOperations,
      ...flowFields,
    ],
  };

  methods = {
    loadOptions: {
      async getFlows(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        return loadFlows.call(this);
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter('resource', i) as string;
        const operation = this.getNodeParameter('operation', i) as string;

        let result: unknown;

        // =========================================================
        // DOSSIER
        // =========================================================
        if (resource === 'dossier') {
          if (operation === 'create') {
            const type = this.getNodeParameter('type', i) as 'candidate' | 'sales';
            const name = this.getNodeParameter('name', i) as string;
            const attachCv = this.getNodeParameter('attachCv', i, false) as boolean;
            const additionalFields = this.getNodeParameter(
              'additionalFields',
              i,
              {},
            ) as Partial<DossierCreateBody>;

            const body: DossierCreateBody = {
              type,
              name,
              ...additionalFields,
            };
            stripEmpty(body);

            if (attachCv) {
              const binProp = this.getNodeParameter(
                'cvBinaryProperty',
                i,
                'data',
              ) as string;
              const binary = this.helpers.assertBinaryData(i, binProp);
              if (binary.mimeType && binary.mimeType !== 'application/pdf') {
                throw new NodeOperationError(
                  this.getNode(),
                  `Binary property "${binProp}" has mime type ${binary.mimeType}; LeadGrid requires application/pdf.`,
                  { itemIndex: i },
                );
              }
              const buffer = await this.helpers.getBinaryDataBuffer(i, binProp);

              // Multipart create: same endpoint, form-encoded body, cv file attached.
              const formData: IDataObject = {};
              for (const [k, v] of Object.entries(body)) {
                if (v === undefined || v === null || v === '') continue;
                formData[k] = typeof v === 'string' ? v : String(v);
              }
              formData.cv = {
                value: buffer,
                options: {
                  filename: binary.fileName ?? 'cv.pdf',
                  contentType: 'application/pdf',
                },
              };

              result = await leadGridApiRequest.call(
                this,
                'POST',
                '/dossiers',
                undefined,
                undefined,
                {
                  body: formData,
                  json: false,
                  headers: {},
                  // @ts-expect-error — n8n's request helper accepts `formData`
                  // at runtime via the request-promise-native shim.
                  formData,
                },
              );
            } else {
              result = await leadGridApiRequest.call(this, 'POST', '/dossiers', body);
            }
          } else if (operation === 'get') {
            const id = this.getNodeParameter('dossierId', i) as string;
            result = await leadGridApiRequest.call(this, 'GET', `/dossiers/${id}`);
          } else if (operation === 'getAll') {
            const returnAll = this.getNodeParameter('returnAll', i) as boolean;
            const filters = this.getNodeParameter('filters', i, {}) as Record<
              string,
              string
            >;
            result = returnAll
              ? await paginate.call(this, '/dossiers', filters)
              : await leadGridApiRequest.call(this, 'GET', '/dossiers', undefined, {
                  ...filters,
                  per_page: this.getNodeParameter('limit', i, 25) as number,
                });
          } else if (operation === 'update') {
            const id = this.getNodeParameter('dossierId', i) as string;
            const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
            stripEmpty(updateFields);
            if (Object.keys(updateFields).length === 0) {
              throw new NodeOperationError(
                this.getNode(),
                'No fields provided to update.',
                { itemIndex: i },
              );
            }
            result = await leadGridApiRequest.call(
              this,
              'PATCH',
              `/dossiers/${id}`,
              updateFields,
            );
          } else if (operation === 'archive') {
            const id = this.getNodeParameter('dossierId', i) as string;
            result = await leadGridApiRequest.call(this, 'DELETE', `/dossiers/${id}`);
          } else if (operation === 'uploadCv') {
            const id = this.getNodeParameter('dossierId', i) as string;
            const binProp = this.getNodeParameter('cvBinaryProperty', i, 'data') as string;
            const binary = this.helpers.assertBinaryData(i, binProp);
            if (binary.mimeType && binary.mimeType !== 'application/pdf') {
              throw new NodeOperationError(
                this.getNode(),
                `Binary property "${binProp}" has mime type ${binary.mimeType}; LeadGrid requires application/pdf.`,
                { itemIndex: i },
              );
            }
            const buffer = await this.helpers.getBinaryDataBuffer(i, binProp);

            // Raw PDF upload — LeadGrid also accepts multipart, but
            // application/pdf is simpler and avoids boundary handling.
            result = await leadGridApiRequest.call(
              this,
              'POST',
              `/dossiers/${id}/cv`,
              buffer,
              undefined,
              {
                headers: { 'Content-Type': 'application/pdf' },
                json: false,
              },
            );
          }
        }

        // =========================================================
        // NOTE
        // =========================================================
        else if (resource === 'note') {
          const dossierId = this.getNodeParameter('dossierId', i) as string;
          if (operation === 'add') {
            const content = this.getNodeParameter('content', i) as string;
            const isInternal = this.getNodeParameter('is_internal', i, true) as boolean;
            result = await leadGridApiRequest.call(
              this,
              'POST',
              `/dossiers/${dossierId}/notes`,
              { content, is_internal: isInternal },
            );
          } else if (operation === 'getAll') {
            result = await leadGridApiRequest.call(
              this,
              'GET',
              `/dossiers/${dossierId}/notes`,
            );
          }
        }

        // =========================================================
        // FLOW
        // =========================================================
        else if (resource === 'flow') {
          if (operation === 'getAll') {
            const type = this.getNodeParameter('type', i, '') as string;
            const qs: IDataObject = {};
            if (type) qs.type = type;
            result = await leadGridApiRequest.call(this, 'GET', '/flows', undefined, qs);
          } else if (operation === 'getStages') {
            const flowId = this.getNodeParameter('flowId', i) as string;
            result = await leadGridApiRequest.call(
              this,
              'GET',
              `/flows/${flowId}/stages`,
            );
          }
        }

        // Normalise the response. Most endpoints wrap the payload under `data`.
        // Lists get exploded into one output item per row so downstream nodes
        // can iterate naturally; single-object responses stay as one item.
        pushResult(returnData, result, i);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

// Remove keys with undefined / null / empty-string values so we don't overwrite
// server defaults or send empty deal_size/deal_currency on non-sales dossiers.
function stripEmpty(obj: IDataObject): void {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null || v === '') delete obj[k];
  }
}

function pushResult(
  returnData: INodeExecutionData[],
  result: unknown,
  itemIndex: number,
): void {
  if (result === undefined || result === null) return;

  if (
    typeof result === 'object' &&
    result !== null &&
    'data' in (result as IDataObject)
  ) {
    const data = (result as { data: unknown }).data;
    if (Array.isArray(data)) {
      for (const row of data) {
        returnData.push({
          json: row as IDataObject,
          pairedItem: { item: itemIndex },
        });
      }
      return;
    }
    if (data !== undefined && data !== null) {
      returnData.push({
        json: data as IDataObject,
        pairedItem: { item: itemIndex },
      });
      return;
    }
  }

  returnData.push({
    json: result as IDataObject,
    pairedItem: { item: itemIndex },
  });
}

async function paginate(
  this: IExecuteFunctions,
  endpoint: string,
  filters: Record<string, string>,
): Promise<{ data: unknown[]; meta: IDataObject }> {
  const all: unknown[] = [];
  let page = 1;
  const perPage = 100;
  let total = Infinity;
  let lastMeta: IDataObject = {};

  while (all.length < total) {
    const res = (await leadGridApiRequest.call(this, 'GET', endpoint, undefined, {
      ...filters,
      page,
      per_page: perPage,
    })) as { data?: unknown[]; meta?: { total?: number } };

    const rows = res.data ?? [];
    all.push(...rows);
    lastMeta = (res.meta as IDataObject) ?? {};
    total = (res.meta?.total as number | undefined) ?? all.length;
    if (rows.length < perPage) break;
    page += 1;
  }

  return { data: all, meta: lastMeta };
}
