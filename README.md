# n8n-nodes-leadgrid

An n8n community node for [LeadGrid.io](https://leadgrid.io) — one API for two pipelines (sales leads and recruitment candidates in the same grid).

## Installation

### n8n Cloud

1. Settings → Community Nodes → Install
2. Enter `n8n-nodes-leadgrid`
3. Confirm and reload

### Self-hosted

```bash
npm install n8n-nodes-leadgrid
```

Or, in your n8n instance: Settings → Community Nodes → Install → `n8n-nodes-leadgrid`.

## Credentials

Create a LeadGrid API key under **Settings → API** in your LeadGrid workspace (Growth plan required), then in n8n:

1. Credentials → New → LeadGrid API
2. Paste your `lg_live_…` key
3. Leave Base URL as `https://leadgrid.io` unless you're on self-hosted or staging

The credential is tested against `GET /api/v1/flows` when saved. A 200 means you're good; 401 means the key is wrong; 403 means your workspace isn't on the Growth plan.

## Resources and operations

### Dossier (sales lead or recruitment candidate)

| Operation | HTTP | Notes |
|---|---|---|
| Create | `POST /dossiers` | Optionally attaches a PDF CV in the same call; if the upload fails, the dossier is rolled back. |
| Get | `GET /dossiers/{id}` | |
| Get Many | `GET /dossiers` | Filter by type / status / stage_id, with pagination. |
| Update | `PATCH /dossiers/{id}` | Move stages, change status, update contact fields. |
| Archive | `DELETE /dossiers/{id}` | Soft-delete (sets status to archived). |
| Upload CV | `POST /dossiers/{id}/cv` | Attach a PDF to an existing dossier. |

### Note

| Operation | HTTP |
|---|---|
| Add | `POST /dossiers/{id}/notes` |
| Get Many | `GET /dossiers/{id}/notes` |

### Flow

| Operation | HTTP |
|---|---|
| Get Many | `GET /flows` |
| Get Stages | `GET /flows/{id}/stages` |

## Common patterns

**Intake form → candidate with CV**

Webhook → LeadGrid (Create dossier, type=candidate, Attach CV=true). One atomic call, dossier + CV together.

**CV parsing pipeline → move stage**

When your parser finishes, LeadGrid (Update dossier) with `current_stage_id` set. This fires a `dossier.stage_changed` webhook event back to any other subscriber.

**Sync to your warehouse**

Schedule Trigger → LeadGrid (Get Many dossiers, type=sales, status=won) → Postgres / BigQuery insert.

## License

MIT — see [LICENSE](./LICENSE).
