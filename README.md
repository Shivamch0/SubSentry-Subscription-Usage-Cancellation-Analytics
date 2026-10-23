# SubSentry

SubSentry is a subscription usage and cancellation analytics starter built on the existing Express, MongoDB/Mongoose, React, Vite, and Tailwind setup. It records customer, plan, subscription, usage, and lifecycle event data and provides a connected analytics workspace.

## Features

- REST CRUD for customers, plans, subscriptions, and usage records.
- Subscription cancellation retains history and writes a cancellation event.
- Dashboard summary, status counts, revenue/cancellation trends, and usage aggregation.
- CSV datasets for Power BI with spreadsheet-formula escaping.
- Axios frontend with customer, plan, subscription, and usage create/list pages.
- CORS allowlist for local frontend origins (configurable).
- Repeatable demo data seeding.

## Project structure

```text
Backend/src/{config,controllers,middleware,models,routes,scripts,utils}
Frontend/src/{services,assets}
powerbi/
```

## Run locally

Prerequisites: Node.js 20.19+ (Vite 8), npm, and MongoDB.

1. Copy `Backend/.env.example` to `Backend/.env` and set `DB_URL` to your MongoDB connection string. Keep the database name in the URI if desired; Mongoose selects the `subsentry` database.
2. Start the API: `cd Backend && npm install && npm run dev` (the existing local `.env` sets port 5000; fallback is 4000).
3. Copy `Frontend/.env.example` to `Frontend/.env` if the API is not at `http://localhost:5000/api`.
4. Start the UI: `cd Frontend && npm install && npm run dev` (default port 5173).
5. Optional demo data: `cd Backend && npm run seed`.

The API provides email/password registration and login. It returns a short-lived access token and stores a rotating refresh token in an HTTP-only cookie. The frontend keeps the access token in memory and refreshes it automatically. All resource and analytics endpoints require a bearer access token. Accounts currently share one workspace dataset; tenant-level data separation and role-based permissions are not implemented. Do not place bearer tokens or refresh tokens in Vite `VITE_*` variables.

## API

All endpoints are under `/api`; JSON success responses use `{ success, statusCode, data, message }`.

| Resource | Endpoints |
|---|---|
| Health | `GET /health` |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Customers | `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id` |
| Plans | `GET/POST /plans`, `GET/PATCH /plans/:id`, `POST /plans/:id/deactivate` |
| Subscriptions | `GET/POST /subscriptions`, `GET/PATCH /subscriptions/:id`, `POST /subscriptions/:id/cancel` |
| Usage | `GET/POST /usage`, `GET/PATCH /usage/:id`, `GET /usage/summary?by=day\|week\|month` |
| Analytics | `GET /analytics/summary`, `GET /analytics/trends/revenue`, `/cancellations`, `/status` |
| Power BI exports | `GET /analytics/exports/customers.csv`, `plans.csv`, `subscriptions.csv`, `usage.csv`, `events.csv` |

List endpoints accept `page`, `limit` (maximum 100), `search`, status and relationship filters, and date filters where applicable. Cancellation is idempotent and emits at most one event. Customer deletion is blocked when subscription history exists; plans are deactivated rather than deleted.

## Analytics definitions and limits

- Estimated MRR includes active and past-due paid subscriptions; yearly price is divided by 12. Discounts, taxes, refunds, and collections are not modeled.
- Cancellation rate in the summary is cancellations recorded in the current calendar month divided by all subscription records currently present. It is a simple portfolio ratio, not a cohort churn rate.
- Average revenue per active subscription is estimated MRR divided by active and past-due count.
- Average usage per active subscription is total recorded usage quantity divided by active and past-due count; usage is simulated in seeded records.
- Revenue trend is a current-state estimate derived from current subscription status and start date, not historical recognized revenue. Cancellation event history is retained, but subscription change snapshots are not comprehensive yet.
- Currency normalization across currencies is not implemented; use one currency per reporting dataset.

## Checks

Run `cd Frontend && npm run build` and `npm run lint`. Run `cd Backend && npm test`. The seed command requires a reachable MongoDB instance.

## Power BI

Use the reproducible model, definitions, DAX, and report page instructions in [powerbi/README.md](powerbi/README.md). Import the five CSV exports independently and refresh them from the API export URLs or from downloaded files. There is no generated `.pbix` in this repository; creating/embedding a report requires Power BI Desktop/service configuration.

## Deployment

Deploy the API and frontend separately, use a managed MongoDB service, set `DB_URL`, `PORT`, and `CORS_ORIGINS` in the server environment, and set `VITE_API_URL` at frontend build time. Add authentication, authorization, rate limits, and a private Power BI embedding flow before exposing customer-specific data publicly.
