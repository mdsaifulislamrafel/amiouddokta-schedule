"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function Clients() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState(""); const [member, setMember] = useState(false);
  const [n, setN] = useState({ name: "", phone: "", isMember: false }); const [err, setErr] = useState("");
  const load = () => fetch(`/api/clients?q=${encodeURIComponent(q)}${member ? "&member=1" : ""}`).then(r => r.json()).then(setList);
  useEffect(() => { load(); }, [q, member]);
  async function add() {
    const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) });
    if (!r.ok) return setErr((await r.json()).error);
    setErr(""); setN({ name: "", phone: "", isMember: false }); load();
  }
  return (
    <>
      <div className="card">
        <h3>নতুন ক্লায়েন্ট / Member যোগ</h3>
        <div className="row">
          <input className="input" style={{ maxWidth: 220 }} placeholder="নাম" value={n.name} onChange={e => setN({ ...n, name: e.target.value })} />
          <input className="input" style={{ maxWidth: 200 }} placeholder="ফোন" value={n.phone} onChange={e => setN({ ...n, phone: e.target.value })} />
          <label style={{ margin: 0 }}><input type="checkbox" checked={n.isMember} onChange={e => setN({ ...n, isMember: e.target.checked })} /> Premium Member</label>
          <button className="btn" onClick={add}>যোগ করুন</button><span style={{ color: "#dc2626" }}>{err}</span>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input className="input" style={{ maxWidth: 260 }} placeholder="নাম / নাম্বার খুঁজুন" value={q} onChange={e => setQ(e.target.value)} />
          <label style={{ margin: 0 }}><input type="checkbox" checked={member} onChange={e => setMember(e.target.checked)} /> শুধু Member</label>
          <a className="btn green" style={{ marginLeft: "auto" }} href="/api/clients/export" download>📥 নাম ও নাম্বার ডাউনলোড (Excel)</a>
        </div>
        <table>
          <thead><tr><th>নাম</th><th>ফোন</th><th>অন্য নাম্বার</th><th>ধরন</th><th></th></tr></thead>
          <tbody>{list.map(c => (
            <tr key={c._id}><td>{c.name}</td><td>{c.phone}</td><td>{(c.altPhones || []).join(", ")}</td>
              <td>{c.isMember ? <span className="badge vip">Premium Member</span> : "Regular"}</td>
              <td><Link href={`/clients/${c._id}`}>ফাইল</Link></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
