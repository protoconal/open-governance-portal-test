# Content Model Guide

> Traceability tag: CONTENT-001
> Relates to: ADR-006

---

## Overview

Every governance module in the portal is a **Directus collection**.  Collections
are the Directus equivalent of database tables — each one has fields (columns),
items (rows), and automatically generated REST and GraphQL API endpoints.

This replaces the previous `IPlugin` system (ADR-001, superseded).  Instead of
writing C# classes, you create collections in the Directus admin panel and the
API is available immediately.

---

## Core Collections

The portal ships with four collections defined in
`src/backend/snapshots/schema.yaml`:

| Collection | Description | Key Fields |
|---|---|---|
| `governance_modules` | Registry of available modules | `id`, `module_id`, `display_name`, `description`, `icon`, `sort_order` |
| `meetings` | Meeting scheduling and minutes | `id`, `title`, `starts_at`, `ends_at`, `location`, `notes` |
| `transactions` | Financial transactions | `id`, `description`, `amount`, `currency`, `date`, `category` |
| `members` | Member directory | `id`, `first_name`, `last_name`, `email`, `role`, `is_active` |

---

## REST API Endpoints

Directus automatically generates CRUD endpoints for each collection:

| Operation | Method | Endpoint | Example |
|---|---|---|---|
| List items | `GET` | `/items/{collection}` | `GET /items/meetings` |
| Get item | `GET` | `/items/{collection}/{id}` | `GET /items/meetings/1` |
| Create item | `POST` | `/items/{collection}` | `POST /items/meetings` |
| Update item | `PATCH` | `/items/{collection}/{id}` | `PATCH /items/meetings/1` |
| Delete item | `DELETE` | `/items/{collection}/{id}` | `DELETE /items/meetings/1` |

### Response envelope

All responses use the `{ data: ... }` envelope:

```json
// GET /items/meetings
{
  "data": [
    {
      "id": 1,
      "title": "Board Meeting",
      "starts_at": "2025-06-01T09:00:00Z",
      "ends_at": "2025-06-01T11:00:00Z"
    }
  ]
}
```

### Filtering and sorting

```bash
# Filter by category
GET /items/transactions?filter[category][_eq]=dues

# Sort by date descending
GET /items/transactions?sort=-date

# Limit and offset
GET /items/meetings?limit=10&offset=20

# Include related items
GET /items/meetings?fields=*,members.*
```

See the [Directus API reference](https://docs.directus.io/reference/items.html)
for the full query syntax.

---

## Adding a New Governance Module

### Step 1 — Create a collection in the Directus admin panel

1. Open `http://localhost:8055/admin`.
2. Go to **Settings → Data Model**.
3. Click **"Create Collection"**.
4. Name it (e.g. `policies`) and define its fields (e.g. `title`, `body`,
   `approved_at`, `status`).
5. Click **Save**.

The REST API is now available at `/items/policies`.

### Step 2 — Register it as a governance module

Create an entry in the `governance_modules` collection so the frontend
discovers it:

```bash
curl -X POST http://localhost:8055/items/governance_modules \
     -H "Content-Type: application/json" \
     -d '{
       "module_id": "policies",
       "display_name": "Policies",
       "description": "Organisational policy documents",
       "icon": "📋",
       "sort_order": 4
     }'
```

The SvelteKit frontend will automatically pick up the new module on the next
page load.

### Step 3 — Export the schema snapshot

```bash
cd src/backend
npx directus schema snapshot ./snapshots/schema.yaml
```

Commit the updated `schema.yaml` so other developers can apply it.

---

## Schema Snapshots

Schema snapshots are the version control mechanism for the Directus data model.

| Command | Purpose |
|---|---|
| `npx directus schema snapshot ./snapshots/schema.yaml` | Export the current schema |
| `npx directus schema apply ./snapshots/schema.yaml` | Apply a schema to the database |
| `npx directus schema diff ./snapshots/schema.yaml` | Show differences between DB and snapshot |

The snapshot file lives at `src/backend/snapshots/schema.yaml` and should be
committed to Git alongside code changes.

---

## Directus Extensions (Custom Logic)

When built-in Directus features are not sufficient, you can write extensions.
Extensions live in `src/backend/extensions/`.

### Extension types

| Type | Use case | Example |
|---|---|---|
| **Hook** | Run code on collection events (before/after create, update, delete) | Validate meeting times don't overlap |
| **Endpoint** | Add custom REST endpoints | `/custom/reports/quarterly-summary` |
| **Operation** | Custom step in Directus Flows (automation) | Send email on new member registration |

### Creating a hook extension

```bash
cd src/backend/extensions
npx create-directus-extension@latest
# Select "hook" when prompted
```

Example hook — validate meeting times:

```javascript
// src/backend/extensions/validate-meetings/src/index.js
export default ({ filter }) => {
  filter('meetings.items.create', async (input) => {
    if (new Date(input.starts_at) >= new Date(input.ends_at)) {
      throw new Error('Meeting start time must be before end time');
    }
    return input;
  });
};
```

See the [Directus extensions guide](https://docs.directus.io/extensions/creating-extensions.html)
for full documentation.

---

## Comparison: Old Plugin System vs Directus Collections

| Aspect | Old (`IPlugin` / ADR-001) | New (Directus / ADR-006) |
|---|---|---|
| Add a module | Write C# class implementing `IPlugin`, register DI services, map endpoints, create EF Core context | Create a collection in the admin panel |
| API endpoints | Hand-written minimal-API routes | Automatic REST + GraphQL |
| Database schema | EF Core migrations | Directus manages schema; snapshots for version control |
| Authentication | Not included (planned) | Built-in (email/password, OAuth, SSO, API tokens) |
| Authorisation | Not included (planned) | Built-in RBAC with visual editor |
| Discovery | Assembly scan + directory probe | Automatic — all collections are API-accessible |
| Distribution | Compile `.dll` or drop into plugins folder | Create collection in admin panel or apply schema snapshot |
| Custom logic | C# code in plugin assembly | Directus extensions (hooks, endpoints, operations) |
| File storage | Not included | Built-in with configurable adapters |
| Real-time | Not included (SignalR planned) | Native WebSockets (`WEBSOCKETS_ENABLED=true`) |

---

## Frontend Integration

The SvelteKit frontend fetches data from Directus using the standard REST API.
The API client in `src/frontend/src/lib/api/`:

1. Reads `VITE_API_BASE_URL` from the environment.
2. Makes requests to `/items/{collection}`.
3. Unwraps the `{ data: [...] }` envelope.
4. Converts `snake_case` field names to `camelCase` for use in Svelte
   components.

```typescript
// Example: fetching meetings
const response = await fetch(`${API_BASE}/items/meetings?sort=-starts_at`);
const { data } = await response.json();
// data is an array of meeting objects
```
