import { useState } from "react";
import api, { setAccessToken } from "../services/api.js";

export default function AuthPage({ onAuthenticated }) {
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

