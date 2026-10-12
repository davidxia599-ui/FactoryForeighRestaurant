# Copilot instructions

## Project shape

This repository is a canteen purchasing and inventory application split into a Vue client, an Express API, and a SQL Server schema:

- `client/` is a Vue 3 + TypeScript single-page app built with Vite. `src/main.ts` installs Pinia, Vue Router, Element Plus, and Vue I18n; `src/App.vue` hosts the routed view.
- `server/` is a TypeScript + Express API. `src/app.ts` configures middleware and mounts feature routers under `/api`; `src/server.ts` starts the listener.
- `database/schema.sql` creates the SQL Server tables and seeds initial tenant data. The database itself is external to the Docker Compose services.
- `docker-compose.yml` runs the API and static client. The client Nginx config serves the SPA and proxies `/api` to the API container. For local Vite development, `client/vite.config.ts` proxies `/api` to `http://localhost:3003`.

The main data flow is: a client view calls a domain API helper in `client/src/api/`; those helpers share the Axios instance in `client/src/api/client.ts`; Express routes in `server/src/routes/` query SQL Server through `server/src/config/database.ts`. The API authenticates protected routes with JWT middleware and takes the tenant ID from the verified token when querying tenant-owned data.

## Build, run, and checks

Run npm commands from the repository root using `--prefix`:

```sh
npm --prefix client run dev
npm --prefix client run build
npm --prefix client run preview

npm --prefix server run dev
npm --prefix server run build
npm --prefix server run bootstrap-admin
npm --prefix server run set-admin-password
npm --prefix server start
```

Run the client and API dev commands in separate terminals. The client dev server uses port 5173 and proxies API requests to port 3003.
Apply `database/schema.sql` before running the admin bootstrap command. It requires `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` in the local environment; set `INITIAL_ADMIN_TENANT_ID` when choosing among multiple tenants. It creates a bcrypt-hashed admin and never prints the password.
For an existing account, `set-admin-password` updates only the password hash for the unique `INITIAL_ADMIN_USERNAME` (defaults to `admin`) and requires `INITIAL_ADMIN_PASSWORD`; it refuses missing or duplicate matches and never prints the password.

To build and start both Docker services:

```sh
docker compose up --build
```

The Compose configuration reads SQL Server connection settings and JWT configuration from the root `.env`; do not commit secrets or copy local secret values into source or documentation. Local server commands load the root `.env` as a fallback when no `server/.env` value is set.
The server parses `DB_SERVER` as either a host (`localhost`) or host plus named instance (`localhost\instance` or `localhost/instance`). When `DB_PORT` is set, it uses that TCP port instead of SQL Server instance discovery. Server startup verifies the connection with `SELECT 1` before listening on port 3003.

There are currently no test or lint scripts in either `package.json`, and no repository test runner is configured. Consequently, there is no full-suite or single-test command at present. The client build runs `vue-tsc` before Vite; the server build runs `tsc`.

## Codebase conventions

### Client

- Use Vue 3 Composition API with `<script setup lang="ts">` for single-file components, and strict TypeScript. The client TypeScript configuration enables `noUnusedLocals` and `noUnusedParameters`.
- Keep page-level UI in `client/src/views/`, reusable UI in `client/src/components/`, and HTTP calls in domain helpers under `client/src/api/`. API helpers use the shared Axios client and return typed results.
- Add protected pages to `client/src/router/index.ts` with lazy-loaded components and `meta.requiresAuth`. Authentication state and persistence are centralized in `client/src/composables/useAuth.ts`; the shared Axios client attaches the stored bearer token and handles authentication failures.
- Shared domain interfaces live in `client/src/types/index.ts`. Keep request and response shapes aligned with the server, including existing camelCase user fields and snake_case database-oriented data fields.
- User-facing text belongs in the Vue I18n message dictionaries in `client/src/i18n/zh-TW.ts` and `client/src/i18n/en.ts`. Keep new message keys in both dictionaries; the locale is selected in `client/src/i18n/index.ts`.
- Tenant selection state is centralized in `client/src/composables/useTenant.ts`. Do not treat a client-selected tenant as authorization; server-side data access must use the authenticated identity.

### API and database

- Keep endpoint implementations in feature routers under `server/src/routes/`, mounted in `server/src/app.ts`. Protected feature routers apply `authenticateToken` at router level and use `AuthRequest` for the verified `req.user`.
- Scope tenant-owned queries with `req.user!.tenantId`; never trust a tenant ID supplied by a client request for authorization.
- Use `query` or `execute` from `server/src/config/database.ts` and pass values as named parameters. SQL Server is accessed through `mssql`. Avoid interpolating user-controlled values into SQL; dynamic identifiers must be fixed or explicitly allow-listed.
- Follow the existing endpoint response conventions: JSON data on success, `{ error: ... }` for API errors, and `try/catch` with server-side error logging around asynchronous route work.
- Keep schema changes consistent with `database/schema.sql` and the existing SQL Server table/column naming. Database-backed fields are generally snake_case; authenticated user claims and client `User` objects use `tenantId`.
- Runtime configuration is loaded from environment variables with `dotenv` in `server/src/config/env.ts`; the server-local `.env` takes precedence over the root `.env`. Keep database and JWT configuration out of committed source.
- `server/src/config/database.ts` owns the shared SQL Server connection pool. Use `verifyDatabaseConnection()` for the startup `SELECT 1` check; route and script database access should reuse `getPool()`, `query()`, or `execute()` rather than opening ad hoc pools.
- `npm --prefix server run bootstrap-admin` creates a first admin only when that username does not already exist. `npm --prefix server run set-admin-password` is for an existing unique username (defaults to `admin`) and changes only its bcrypt password hash. Both read credentials from environment variables; never put actual password values in source, logs, or docs.
