# Gestion Magasin Frontend

Next.js interface for a store operations platform for catalog, stock, store inventory, purchases, sales, cash register, promotions, expenses, attendance, reporting, users, notifications, and multi-store workflows.

This frontend is built around real staff workflows: authenticated navigation, dense dashboards, tables, filters, create/edit/detail pages, forms, actions, settings, notifications, and production data constraints.

## What It Shows

- Product UI work for an internal business system.
- Data-heavy React/Next.js screens with real workflow depth.
- State management with Redux Toolkit and redux-saga.
- Authenticated app structure with NextAuth and API-backed routes.
- Form, table, dashboard, notification, and settings flows built for daily operations.

## Key Capabilities

- Next.js dashboard for articles, stock, inventory, store stock, stock transfers, purchases, sales, caisse, promotions, expenses, attendance, stores, users, and settings.
- MUI data grids, store tabs, filters, forms, date pickers, dashboards, action controls, and reporting-oriented pages.
- Redux Toolkit and redux-saga state flows across catalog, sales, purchases, stock, users, auth, and notifications.
- Formik/Zod forms for stock movements, sales, purchases, attendance, expenses, promotions, stores, and users.
- Jest and Testing Library tooling for UI behavior and state logic.

## Stack

- Next.js 16, React 19, TypeScript
- NextAuth, Axios, React Redux
- Redux Toolkit, redux-saga
- MUI, MUI X Data Grid, Sass, chart components
- Formik, Zod, date-fns
- Jest, Testing Library, ts-jest, Bun

## Related Repository

- Backend API: [Altroo/gestion_magasin_backend](https://github.com/Altroo/gestion_magasin_backend)

## Screenshots

Redacted production screenshots. Sensitive names, amounts, dates, and records are blurred.

![Store operations dashboard](docs/screenshots/gestion-magasin-dashboard.png)

![Cash register workflow](docs/screenshots/gestion-magasin-caisse.png)

![Stock management](docs/screenshots/gestion-magasin-stock.png)

## Local Setup

Create local-only environment variables for the API base URL, auth settings, websocket endpoints, and public runtime config. Do not commit `.env` files or production credentials.

```bash
bun install
bun run dev
```

Default local port: `3006`.

## Quality Checks

```bash
bun x jest --runInBand --coverage=false
bun run lint
bun run build
```

## Portfolio Note

The repository is public for portfolio review. Screenshots are redacted, and sensitive production values are intentionally hidden.
