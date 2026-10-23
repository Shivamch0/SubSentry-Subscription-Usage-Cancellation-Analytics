import { useCallback, useEffect, useState } from "react";
import { getData, postData } from "../services/api.js";
import { formatMoney } from "../utils/format.js";

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

export default function ResourcePage({ section, notify }) {
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
    if (field === "price") return formatMoney(value);
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

