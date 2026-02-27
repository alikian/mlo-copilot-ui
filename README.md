# MLO Copilot UI

React + TypeScript UI for “MLO Copilot”, built to integrate with an existing FastAPI backend.

## Tech

- React 18 + TypeScript + Vite
- Material UI (MUI) + MUI icons + MUI DataGrid
- React Router v6
- Axios + TanStack Query (React Query)
- React Hook Form + Zod
- dayjs

## Getting started

1) Install deps

```bash
npm install
```

2) Configure API base URL

Create a `.env` file (or export env vars) and set:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

You can also copy from `.env.example`.

Important: Vite only reads `VITE_` env vars at startup. If you change `VITE_API_BASE_URL`, restart `npm run dev`.

Example one-liner:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

3) Run

```bash
npm run dev
```

## Temporary auth headers

This UI reads the following from `localStorage`:

- `tenantId` (default: `demo-tenant`)
- `userId` (default: `demo-user`)

An Axios interceptor automatically attaches these headers on every request:

- `x-tenant-id: <tenantId>`
- `x-user-id: <userId>`

You can edit these in the in-app Settings page.

## Backend endpoints expected

- `GET  /tenants/{tenantId}/cases`
- `POST /tenants/{tenantId}/cases`
- `GET  /tenants/{tenantId}/cases/{caseId}`
- `PATCH/tenants/{tenantId}/cases/{caseId}`
- `POST /tenants/{tenantId}/cases/{caseId}/calculate`
- `POST /tenants/{tenantId}/cases/{caseId}/guidelines/query`
- `POST /tenants/{tenantId}/cases/{caseId}/snapshot`
- `POST /tenants/{tenantId}/cases/{caseId}/outcome`
