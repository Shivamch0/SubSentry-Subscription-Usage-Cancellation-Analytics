# Power BI setup

The API exports five independent CSV files. Sign in through the frontend and use its **Power BI exports** screen to download all five authenticated files. For scripting, call `POST /api/auth/login`, retain the access token from its JSON response and the refresh cookie, then send `Authorization: Bearer <accessToken>` to the export paths. The API returns `text/csv` with quoted fields and formula-prefix escaping.

| Dataset URL | Grain | Key and links |
|---|---|---|
| `/api/analytics/exports/customers.csv` | One customer | `_id` → subscription/usage customer |
| `/api/analytics/exports/plans.csv` | One plan | `_id` → subscription plan |
| `/api/analytics/exports/subscriptions.csv` | One subscription | `_id`; customer and plan reference IDs |
| `/api/analytics/exports/usage.csv` | One usage record | `_id`; customer and subscription reference IDs |
| `/api/analytics/exports/events.csv` | One lifecycle event | `_id`; subscription reference ID |

Use Power BI Desktop **Get data → Text/CSV**, load each file, confirm date types as Date/Time and price/quantity as decimal/whole number. Create one-to-many, single-direction relationships `DimCustomer[_id]` to both subscription and usage facts, `DimPlan[_id]` to subscription facts, and `FactSubscriptions[_id]` to usage/event subscription IDs. Build a Date table and relate it actively to usage `eventAt`; use inactive relationships for subscription `startDate` and event `occurredAt` when measures need those dates. Avoid joining usage directly into subscription visuals without distinct subscription counting.

## Report pages

1. **Executive overview:** cards for Estimated MRR, Active Subscriptions, Total Customers and Cancellation Rate; line chart of subscription starts by month; bar chart of current status counts; plan and date slicers.
2. **Revenue analytics:** Estimated MRR by plan and billing interval, current estimated MRR by plan, and a monthly start cohort view. Label these as estimates; this dataset does not provide historical payment or MRR snapshots.
3. **Cancellation analytics:** cancellations by event month, reason and plan; compare rates with the denominator defined in the measures file. Add date and plan slicers.
4. **Customer usage:** usage quantity by day/week/month and activity type, usage per active subscription, and plan distribution. Usage is simulated for demo rows.
5. **Subscription performance:** new starts versus cancellation events, current status by plan, and monthly/yearly plan comparisons. Current status is a current-state snapshot and cannot reconstruct historical status without snapshots.

Use cross-filtering between charts, date range slicers, drill-through on customer/plan, and tooltips with counts and definitions. Refresh by re-exporting the CSVs and replacing the source files (or configure a private authenticated gateway/API pipeline). Do not use Publish to web for customer-specific data. A service-principal embed requires tenant, workspace, capacity/licensing, and server-side token configuration; none is configured here.

Field definitions are in [data-dictionary.md](data-dictionary.md), and formulas are in [measures.dax](measures.dax). No `.pbix` is included.
