"use client";

import { BadgeCheck, BriefcaseBusiness, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { apiSend } from "../lib/api";
import { storeSession, type StoredUser } from "../lib/session";

interface AuthResponse {
  token: string;
  user: StoredUser;
}

export function LoginForm() {
  const [email, setEmail] = useState("admin@globalwork.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(event?: FormEvent<HTMLFormElement>, demoEmail = email) {
    event?.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await apiSend<AuthResponse>("/auth/login", "POST", {
        email: demoEmail,
        password
      });
      storeSession(response);
      window.location.href = "/";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="loginShell">
      <section className="loginPanel">
        <div className="brand loginBrand">
          <BriefcaseBusiness size={28} aria-hidden />
          <div>
            <strong>GlobalWork</strong>
            <span>EOR Console</span>
          </div>
        </div>
        <h1>Sign in</h1>
        <p className="session">Use a seeded demo account or enter credentials from a local user.</p>

        {error ? <div className="error">{error}</div> : null}

        <form className="loginForm" onSubmit={(event) => void login(event)}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          <button type="submit" disabled={busy}>
            <LogIn size={16} /> Sign in
          </button>
        </form>

        <div className="demoLogins">
          <button onClick={() => void login(undefined, "admin@globalwork.local")} disabled={busy}>
            <BadgeCheck size={16} /> Platform admin
          </button>
          <button onClick={() => void login(undefined, "owner@acme.example")} disabled={busy}>
            <BriefcaseBusiness size={16} /> Client owner
          </button>
        </div>
      </section>
    </main>
  );
}
