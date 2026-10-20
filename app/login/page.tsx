"use client";
import { useState } from "react";
export default function Login() {
  const [u, setU] = useState(""), [p, setP] = useState(""), [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
    if (r.ok) location.href = "/"; else setErr((await r.json()).error);
  }
  return (
    <div className="wrap" style={{ maxWidth: 380, marginTop: 100 }}>
      <form className="card" onSubmit={submit}>
        <h2>অ্যাডমিন লগইন</h2>
        <label>ইউজারনেম</label><input className="input" value={u} onChange={e => setU(e.target.value)} />
        <label style={{ marginTop: 10 }}>পাসওয়ার্ড</label><input className="input" type="password" value={p} onChange={e => setP(e.target.value)} />
        {err && <p style={{ color: "#dc2626" }}>{err}</p>}
        <button className="btn" style={{ marginTop: 14, width: "100%" }}>লগইন</button>
      </form>
    </div>
  );
}
