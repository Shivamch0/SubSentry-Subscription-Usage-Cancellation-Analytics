import { useState } from "react";
import api from "../services/api.js";

export default function PowerBIPage({ notify }) {
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

