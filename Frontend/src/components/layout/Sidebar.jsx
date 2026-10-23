import { navigation } from "../../constants/navigation.js";

export default function Sidebar({ active, setActive }) {
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

