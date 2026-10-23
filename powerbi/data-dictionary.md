# Export data dictionary

IDs are MongoDB ObjectId strings. Date values are ISO date/time strings emitted by MongoDB JSON serialization; null optional values export as empty cells. All datasets omit authentication fields, password hashes and secrets.

| Dataset | Field | Meaning |
|---|---|---|
| Customers | `_id` | Customer key |
| | `name`, `email`, `company` | Customer attributes (email is included for joining/identification; remove it for broad sharing) |
| | `status` | `active` or `inactive` |
| | `createdAt` | Record creation timestamp |
| Plans | `_id` | Plan key |
| | `name`, `billingInterval`, `price`, `currency` | Plan and list price; annual amount is normalized by dividing by 12 for MRR |
| | `active` | Whether new subscriptions can use the plan |
| Subscriptions | `_id` | Subscription key |
| | `customer`, `plan` | Foreign keys to customer and plan |
| | `startDate` | Subscription start timestamp |
| | `status` | `trial`, `active`, `past_due`, `cancelled`, `expired` |
| | `cancellationDate`, `cancellationEffectiveDate`, `cancellationReason` | Cancellation request/effective details, if cancelled |
| | `autoRenew` | Renewal flag |
| Usage | `_id` | Usage event key |
| | `customer`, `subscription` | Foreign keys |
| | `activityType`, `quantity`, `eventAt` | Activity class, count and timestamp |
| Events | `_id` | Lifecycle event key |
| | `subscription` | Subscription foreign key |
| | `type`, `occurredAt`, `previousStatus`, `newStatus`, `reason` | Event details; cancellation currently emitted by cancel endpoint |

There is no payment table. Revenue measures are normalized list-price estimates, not recognized or collected revenue. Multi-currency conversion is not implemented; filter to a single currency before summing prices.
