export default function Metric({ label, value, hint, icon, accent }) {
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

