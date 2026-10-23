import { useCallback, useEffect, useState } from "react";
import api, { getData, postData, setAccessToken } from "./services/api.js";

const navigation = [
  { id: "dashboard", label: "Overview", icon: "◫" },
  { id: "customers", label: "Customers", icon: "♙" },
  { id: "plans", label: "Plans", icon: "▤" },
  { id: "subscriptions", label: "Subscriptions", icon: "↗" },
  { id: "usage", label: "Usage activity", icon: "◷" },
  { id: "powerbi", label: "Power BI exports", icon: "▥" },
];
const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

function Sidebar({ active, setActive }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <span>
          subsentry<span className="brand-dot">.</span>
        </span>
      </div>
      <div className="side-label">WORKSPACE</div>
      <nav>
        {navigation.map((item) => (
          <button
            className={`nav-item ${active === item.id ? "selected" : ""}`}
            key={item.id}
            onClick={() => setActive(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.id === "dashboard" && <span className="nav-live" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <span className="help-icon">✳</span>
          <strong>Make better decisions</strong>
          <p>Connect your subscription data and spot meaningful trends.</p>
          <button onClick={() => setActive("usage")}>
            Explore activity <span>↗</span>
          </button>
        </div>
        <div className="profile">
          <div className="avatar">SS</div>
          <div>
            <strong>Workspace admin</strong>
            <small>Analytics workspace</small>
          </div>
          <span className="profile-menu">···</span>
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value, hint, icon, accent }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${accent}`}>{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-hint">
        <span className="hint-dot">●</span>
        {hint}
      </div>
    </article>
  );
}

function Dashboard({ summary, loading, error, onRefresh }) {
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
          value={loading ? "—" : money(data.estimatedMrr)}
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
              <strong>{money(data.estimatedMrr)} estimated MRR</strong>
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

const sections = {
  customers: {
    title: "Customers",
    subtitle: "Manage the people and organizations behind your subscriptions.",
    fields: [
      { key: "name", label: "Full name" },
      { key: "email", label: "Email address", type: "email" },
      { key: "company", label: "Company (optional)" },
    ],
    columns: ["name", "email", "company", "status"],
  },
  plans: {
    title: "Plans",
    subtitle: "Set up the products and billing options customers subscribe to.",
    fields: [
      { key: "name", label: "Plan name" },
      { key: "price", label: "Price", type: "number" },
      {
        key: "billingInterval",
        label: "Billing interval",
        type: "select",
        options: ["monthly", "yearly"],
      },
      { key: "currency", label: "Currency", defaultValue: "USD" },
    ],
    columns: ["name", "billingInterval", "price", "active", "actions"],
  },
  subscriptions: {
    title: "Subscriptions",
    subtitle: "Track subscription status and manage cancellations.",
    fields: [
      { key: "customer", label: "Customer ID" },
      { key: "plan", label: "Plan ID" },
    ],
    columns: ["customer", "plan", "status", "startDate", "actions"],
  },
  usage: {
    title: "Usage activity",
    subtitle: "Review recorded customer activity over time.",
    fields: [
      { key: "customer", label: "Customer ID" },
      { key: "subscription", label: "Subscription ID" },
      { key: "activityType", label: "Activity type" },
      { key: "quantity", label: "Quantity", type: "number", defaultValue: 1 },
    ],
    columns: ["activityType", "quantity", "customer", "eventAt"],
  },
};

function ResourcePage({ section, notify }) {
  const config = sections[section];
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await getData(`/${section}`, {
        params: { search, limit: 50 },
      });
      setItems(response.items || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  }, [section, search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    try {
      await postData(`/${section}`, form);
      setForm({});
      notify(`${config.title.slice(0, -1)} created`);
      load();
    } catch (e) {
      notify(e.response?.data?.message || "Could not save this record", true);
    }
  };
  const actOn = async (item) => {
    try {
      if (section === "subscriptions")
        await postData(`/subscriptions/${item._id}/cancel`, {
          reason: "Cancelled from SubSentry workspace",
        });
      else await postData(`/plans/${item._id}/deactivate`, {});
      notify(
        section === "subscriptions"
          ? "Subscription cancelled"
          : "Plan deactivated",
      );
      load();
    } catch (e) {
      notify(e.response?.data?.message || "Action failed", true);
    }
  };
  const display = (item, field) => {
    const value = item[field];
    if (value && typeof value === "object")
      return value.name || value.email || String(value._id || "").slice(-8);
    if (field === "price") return money(value);
    if (
      field.toLowerCase().includes("date") ||
      field === "startDate" ||
      field === "eventAt"
    )
      return value ? new Date(value).toLocaleDateString() : "—";
    return value === undefined || value === "" ? "—" : String(value);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            WORKSPACE / {config.title.toUpperCase()}
          </div>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <label className="search-box">
          <span>⌕</span>
          <input
            placeholder={`Search ${config.title.toLowerCase()}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="resource-layout">
        <section className="panel resource-panel">
          <div className="panel-heading">
            <div>
              <h2>All {config.title.toLowerCase()}</h2>
              <p>{items.length} records shown</p>
            </div>
            <button className="outline-button compact" onClick={load}>
              ⟳ Refresh
            </button>
          </div>
          {error ? (
            <div className="empty-state">
              {error}
              <button className="text-button" onClick={load}>
                Retry
              </button>
            </div>
          ) : busy ? (
            <div className="empty-state">Loading records…</div>
          ) : items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {config.columns.map((field) => (
                      <th key={field}>{field.replace(/([A-Z])/g, " $1")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id}>
                      {config.columns.map((field) => (
                        <td key={field}>
                          {field === "actions" ? (
                            <button
                              className="row-action"
                              onClick={() => actOn(item)}
                              disabled={
                                section === "subscriptions"
                                  ? item.status === "cancelled" ||
                                    item.status === "expired"
                                  : !item.active
                              }
                            >
                              {section === "subscriptions"
                                ? item.status === "cancelled"
                                  ? "Cancelled"
                                  : "Cancel"
                                : item.active
                                  ? "Deactivate"
                                  : "Inactive"}
                            </button>
                          ) : field === "status" ? (
                            <span className="table-status">
                              {display(item, field)}
                            </span>
                          ) : (
                            display(item, field)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No records yet. Create your first record with the form.
            </div>
          )}
        </section>
        <section className="panel create-panel">
          <div className="panel-heading">
            <div>
              <h2>Add {config.title.slice(0, -1).toLowerCase()}</h2>
              <p>Fill in the details below.</p>
            </div>
          </div>
          <form onSubmit={create}>
            {config.fields.map((field) => (
              <label className="form-field" key={field.key}>
                {field.label}
                {field.type === "select" ? (
                  <select
                    required
                    value={form[field.key] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [field.key]: e.target.value })
                    }
                  >
                    <option value="">Choose interval</option>
                    {field.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required={
                      field.key !== "company" && field.key !== "currency"
                    }
                    type={field.type || "text"}
                    min={field.type === "number" ? 0 : undefined}
                    placeholder={field.label}
                    value={form[field.key] ?? field.defaultValue ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]:
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                )}
              </label>
            ))}
            <button className="primary-button" type="submit">
              Create {config.title.slice(0, -1).toLowerCase()} <span>→</span>
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

function PowerBIPage({ notify }) {
  const [busy, setBusy] = useState("");
  const datasets = [
    {
      id: "customers",
      title: "Customers",
      description: "Customer dimension with account status and creation date.",
      icon: "♙",
    },
    {
      id: "plans",
      title: "Plans",
      description: "Billing intervals, prices and plan availability.",
      icon: "▤",
    },
    {
      id: "subscriptions",
      title: "Subscriptions",
      description:
        "Lifecycle status, plan/customer keys and cancellation fields.",
      icon: "↗",
    },
    {
      id: "usage",
      title: "Usage activity",
      description: "Customer activity quantity and event timestamps.",
      icon: "◷",
    },
    {
      id: "events",
      title: "Lifecycle events",
      description: "Subscription state changes and cancellation reasons.",
      icon: "⌁",
    },
  ];
  const download = async (id) => {
    setBusy(id);
    try {
      const response = await api.get(`/analytics/exports/${id}.csv`, {
        responseType: "blob",
      });
      const href = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `${id}.csv`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
      notify(`${id}.csv downloaded`);
    } catch (e) {
      notify(
        e.response?.data?.message || "Could not export this dataset",
        true,
      );
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / ANALYTICS</div>
          <h1>Power BI exports</h1>
          <p>Download clean, authenticated datasets for your Power BI model.</p>
        </div>
        <span className="select-pill">
          5 datasets <span>✳</span>
        </span>
      </div>
      <div className="export-grid">
        {datasets.map((dataset) => (
          <article className="panel export-card" key={dataset.id}>
            <span className="export-icon">{dataset.icon}</span>
            <h2>{dataset.title}</h2>
            <p>{dataset.description}</p>
            <button
              className="outline-button"
              onClick={() => download(dataset.id)}
              disabled={Boolean(busy)}
            >
              {busy === dataset.id ? "Preparing…" : "Download CSV"}{" "}
              <span>↓</span>
            </button>
          </article>
        ))}
      </div>
      <section className="panel export-note">
        <div className="insight-symbol green">✳</div>
        <div>
          <h2>Connect the datasets in Power BI Desktop</h2>
          <p>
            Use the data dictionary, relationship map, DAX measures and
            five-page report spec in the repository’s <code>powerbi</code>{" "}
            folder. Revenue fields are normalized list-price estimates; the API
            does not record payments or historical MRR snapshots.
          </p>
        </div>
      </section>
    </>
  );
}

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api.post(`/auth/${mode}`, form);
      const data = response.data.data;
      setAccessToken(data.accessToken);
      onAuthenticated(data.user);
    } catch (e) {
      setError(
        e.response?.data?.message || "Could not connect to the SubSentry API",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">S</span>
          <span>
            subsentry<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="eyebrow">SUBSCRIPTION INTELLIGENCE</div>
        <h1>{mode === "login" ? "Welcome back" : "Create your workspace"}</h1>
        <p>Sign in to see your subscription analytics.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          {mode === "register" && (
            <label className="form-field">
              Your name
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label className="form-field">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="form-field">
            Password
            <input
              required
              type="password"
              minLength={mode === "register" ? 10 : undefined}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {mode === "register" && <small>Use at least 10 characters.</small>}
          </label>
          <button className="primary-button" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}{" "}
            <span>→</span>
          </button>
        </form>
        <div className="auth-toggle">
          {mode === "login" ? "New to SubSentry?" : "Already registered?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {" "}
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </div>
        <div className="auth-security">
          Your session uses short-lived access tokens and a rotating, HTTP-only
          refresh cookie.
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await getData("/analytics/summary"));
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    api
      .post("/auth/refresh", {})
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      })
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, []);
  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, refresh]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  useEffect(() => {
    const handler = (event) => setActive(event.detail);
    window.addEventListener("navigate", handler);
    return () => window.removeEventListener("navigate", handler);
  }, []);
  const notify = (message, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => setToast(null), 3200);
  };
  const signOut = async () => {
    try {
      await api.post("/auth/logout", {});
    } finally {
      setAccessToken("");
      setUser(null);
      setSummary(null);
    }
  };
  if (!sessionReady)
    return (
      <main className="auth-page">
        <div className="auth-loading">
          SubSentry <span>✳</span>
        </div>
      </main>
    );
  if (!user) return <AuthPage onAuthenticated={setUser} />;
  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-area">
        <header className="topbar">
          <div className="crumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>
              {navigation.find((item) => item.id === active)?.label || active}
            </strong>
          </div>
          <div className="top-actions">
            <span className="connection">
              <i /> API connected
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={signOut}
            >
              ↪
            </button>
            <div className="avatar top-avatar" title={user.email}>
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="page-content">
          {active === "dashboard" ? (
            <Dashboard
              summary={summary}
              loading={loading}
              error={error}
              onRefresh={refresh}
            />
          ) : active === "powerbi" ? (
            <PowerBIPage notify={notify} />
          ) : (
            <ResourcePage key={active} section={active} notify={notify} />
          )}
        </div>
        <footer className="footer">
          <span>© 2026 SubSentry</span>
          <span>
            Subscription intelligence, made clear <b>✳</b>
          </span>
        </footer>
      </main>
      {toast && (
        <div className={`toast ${toast.isError ? "toast-error" : ""}`}>
          {toast.isError ? "!" : "✓"} &nbsp;{toast.message}
        </div>
      )}
    </div>
  );
}
