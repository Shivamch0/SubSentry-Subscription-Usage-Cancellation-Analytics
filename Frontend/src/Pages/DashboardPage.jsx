import Metric from "../components/dashboard/Metric.jsx";
import { formatMoney } from "../utils/format.js";

export default function Dashboard({ summary, loading, error, onRefresh }) {
  const data = summary || {};
  const maxStatusCount = Math.max(
    1,
    ...(data.subscriptionsByStatus || []).map((item) => item.count),
  );
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {today.toUpperCase()} <span className="eyebrow-dot">•</span> LIVE
            OVERVIEW
          </div>
          <h1>
            Good morning, team <span className="wave">✳</span>
          </h1>
          <p>Here’s what’s happening across your subscriptions.</p>
        </div>
        <button className="outline-button" onClick={onRefresh}>
          <span>⟳</span> Refresh data
        </button>
      </div>
      {error && (
        <div className="notice error-notice">
          <span>!</span>
          <div>
            <strong>Couldn’t reach the API</strong>
            <p>{error} Check that the backend and database are running.</p>
          </div>
        </div>
      )}
      <div className="metric-grid">
        <Metric
          label="Estimated MRR"
          value={loading ? "—" : formatMoney(data.estimatedMrr)}
          hint="Normalized recurring revenue"
          icon="$"
          accent="mint"
        />
        <Metric
          label="Active subscriptions"
          value={
            loading ? "—" : (data.activeSubscriptions || 0).toLocaleString()
          }
          hint="Active and past due"
          icon="↗"
          accent="violet"
        />
        <Metric
          label="Customers"
          value={loading ? "—" : (data.totalCustomers || 0).toLocaleString()}
          hint="Across your workspace"
          icon="♙"
          accent="amber"
        />
        <Metric
          label="Cancellations this month"
          value={
            loading ? "—" : (data.cancelledSubscriptions || 0).toLocaleString()
          }
          hint={`${((data.cancellationRate || 0) * 100).toFixed(1)}% of all subscriptions`}
          icon="↘"
          accent="rose"
        />
      </div>
      <div className="content-grid">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Subscription health</h2>
              <p>A snapshot of your current portfolio</p>
            </div>
            <span className="select-pill">
              All time <span>⌄</span>
            </span>
          </div>
          <div className="chart-placeholder">
            <div className="chart-y">
              <span>{maxStatusCount}</span>
              <span>{Math.round(maxStatusCount * 0.75)}</span>
              <span>{Math.round(maxStatusCount * 0.5)}</span>
              <span>{Math.round(maxStatusCount * 0.25)}</span>
              <span>0</span>
            </div>
            <div className="chart-area">
              <div className="grid-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="bars">
                {(data.subscriptionsByStatus || []).map((item, idx) => (
                  <div className="bar-group" key={item.status}>
                    <div
                      className={`bar bar-${idx}`}
                      style={{
                        height: `${Math.max(3, (item.count / maxStatusCount) * 100)}%`,
                      }}
                      title={`${item.status}: ${item.count}`}
                    />
                    <span>{item.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot dot-active" />
              Subscriptions by status
            </span>
            <span className="legend-caption">Current portfolio</span>
          </div>
        </section>
        <section className="panel insight-panel">
          <div className="panel-heading">
            <div>
              <h2>At a glance</h2>
              <p>Useful signals from your data</p>
            </div>
            <span className="insight-spark">✳</span>
          </div>
          <div className="insight-item">
            <span className="insight-symbol purple">↗</span>
            <div>
              <strong>{formatMoney(data.estimatedMrr)} estimated MRR</strong>
              <p>
                Monthly plans plus annual plans normalized to a monthly amount.
              </p>
            </div>
          </div>
          <div className="insight-item">
            <span className="insight-symbol green">◉</span>
            <div>
              <strong>
                {(data.totalUsageEvents || 0).toLocaleString()} usage events
              </strong>
              <p>Recorded activity across your subscriptions.</p>
            </div>
          </div>
          <div className="insight-item">
            <span className="insight-symbol orange">⌁</span>
            <div>
              <strong>
                {(data.averageUsagePerActiveSubscription || 0).toFixed(1)}{" "}
                average usage
              </strong>
              <p>Events per active subscription in the recorded dataset.</p>
            </div>
          </div>
          <div className="insight-foot">
            Metrics are estimates from current subscription records.
          </div>
        </section>
      </div>
      <section className="panel status-panel">
        <div className="panel-heading">
          <div>
            <h2>Portfolio status</h2>
            <p>Subscriptions grouped by their current lifecycle state</p>
          </div>
          <button
            className="text-button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("navigate", { detail: "subscriptions" }),
              )
            }
          >
            View subscriptions <span>→</span>
          </button>
        </div>
        <div className="status-list">
          {(data.subscriptionsByStatus || []).map((item, i) => (
            <div className="status-row" key={item.status}>
              <span className={`status-color status-color-${i}`} />
              <span className="status-name">
                {item.status.replace("_", " ")}
              </span>
              <div className="status-track">
                <i
                  style={{
                    width: `${Math.min(100, data.activeSubscriptions ? (item.count / Math.max(1, data.activeSubscriptions)) * 100 : 0)}%`,
                  }}
                />
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

