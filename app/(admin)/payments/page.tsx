"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ReceivePayment, { PaymentList } from "@/components/ReceivePayment";
import { tk, waLink, PAY_METHODS } from "@/lib/utils";

// টাকা জমা — কালেকশন সারসংক্ষেপ, নতুন জমা, রশিদের তালিকা, বকেয়ার তালিকা
export default function Payments() {
  const today = new Date().toLocaleDateString("en-CA");
  const [tab, setTab] = useState("receive");
  const [sum, setSum] = useState<any>(null);
  const [dues, setDues] = useState<any>(null);
  const [key, setKey] = useState(0);
  const [flt, setFlt] = useState({ from: today.slice(0, 8) + "01", to: today, method: "" });
  const [preset, setPreset] = useState<{ clientId?: string; jobId?: string; kind?: any }>({});
  const reload = () => { setKey(k => k + 1); fetch("/api/summary").then(r => r.json()).then(setSum); fetch("/api/dues").then(r => r.json()).then(setDues); };
  useEffect(() => { const t = new URLSearchParams(location.search).get("tab"); if (t) setTab(t); reload(); }, []);
  const q = new URLSearchParams(Object.entries(flt).filter(([, v]) => v) as any).toString();
  const receive = (clientId: string, jobId?: string, kind?: string) => { setPreset({ clientId, jobId, kind }); setTab("receive"); window.scrollTo(0, 0); };

  return (
    <>
      <div className="stats">
        <div className="stat-card green"><small>আজকের কালেকশন</small><div className="stat">{tk(sum?.todayTotal)}</div></div>
        <div className="stat-card"><small>এই মাসের কালেকশন</small><div className="stat">{tk(sum?.monthTotal)}</div>
          <small>{sum && Object.entries(sum.byMethod).map(([m, v]: any) => `${m}: ${tk(v)}`).join(" • ")}</small></div>
        <div className="stat-card red" style={{ cursor: "pointer" }} onClick={() => setTab("dues")}><small>মোট বকেয়া</small><div className="stat">{tk(sum?.totalDue)}</div></div>
      </div>
      <div className="card">
        <div className="tabs">
          <button className={`tab ${tab === "receive" ? "on" : ""}`} onClick={() => setTab("receive")}>➕ টাকা জমা নিন</button>
          <button className={`tab ${tab === "history" ? "on" : ""}`} onClick={() => setTab("history")}>🧾 রশিদের তালিকা</button>
          <button className={`tab ${tab === "dues" ? "on" : ""}`} onClick={() => setTab("dues")}>⚠ বকেয়ার তালিকা {dues && `(${dues.jobs.length + dues.packages.length})`}</button>
        </div>
        {tab === "receive" && (
          <>
            {preset.clientId && <p style={{ marginTop: 0 }}><a href="#" onClick={e => { e.preventDefault(); setPreset({}); }}>← অন্য ক্লায়েন্ট বাছাই করুন</a></p>}
            <ReceivePayment key={JSON.stringify(preset)} clientId={preset.clientId} jobId={preset.jobId} kind={preset.kind} onDone={reload} />
          </>
        )}
        {tab === "history" && (
          <>
            <div className="row" style={{ marginBottom: 10 }}>
              <label>থেকে <input type="date" className="input" value={flt.from} onChange={e => setFlt({ ...flt, from: e.target.value })} /></label>
              <label>পর্যন্ত <input type="date" className="input" value={flt.to} onChange={e => setFlt({ ...flt, to: e.target.value })} /></label>
              <label>মাধ্যম <select className="input" value={flt.method} onChange={e => setFlt({ ...flt, method: e.target.value })}><option value="">সব</option>{PAY_METHODS.map(m => <option key={m}>{m}</option>)}</select></label>
              <button className="btn gray" onClick={() => setFlt({ ...flt, from: today, to: today })}>আজ</button>
              <button className="btn gray" onClick={() => setFlt({ ...flt, from: today.slice(0, 8) + "01", to: today })}>এই মাস</button>
            </div>
            <PaymentList query={q} reloadKey={key} onChange={reload} showClient />
          </>
        )}
        {tab === "dues" && dues && (
          <>
            <h4 style={{ marginTop: 0 }}>কাজের বকেয়া</h4>
            <div style={{ overflowX: "auto" }}><table>
              <thead><tr><th>ক্লায়েন্ট</th><th>কাজ</th><th>স্ট্যাটাস</th><th>চার্জ</th><th>জমা</th><th>বকেয়া</th><th></th></tr></thead>
              <tbody>
                {dues.jobs.map((j: any) => (
                  <tr key={j._id}>
                    <td><Link href={`/clients/${j.client?._id}`}>{j.client?.name}</Link><br /><small>{j.client?.phone}</small></td>
                    <td><Link href={`/jobs/${j._id}`}>{j.jobType === "edit" && "✂ "}{j.serviceType}{j.title && ` — ${j.title}`}</Link><br /><small>{j.date}</small></td>
                    <td><span className={`badge ${j.status}`}>{j.status}</span></td>
                    <td>{tk(j.charge)}</td><td>{tk(j.paid)}</td><td><b style={{ color: "#dc2626" }}>{tk(j.due)}</b></td>
                    <td className="row" style={{ flexWrap: "nowrap" }}>
                      <button className="btn green" style={{ padding: "4px 10px" }} onClick={() => receive(j.client._id, j._id)}>টাকা নিন</button>
                      {j.client?.phone && <a className="btn wa" style={{ padding: "4px 10px" }} target="_blank" rel="noreferrer" href={waLink(j.client.phone, `আসসালামু আলাইকুম ${j.client.name}, আপনার "${j.serviceType}" (${j.date}) কাজের বকেয়া ${tk(j.due)}। অনুগ্রহ করে পরিশোধ করুন। ধন্যবাদ — আমিও উদ্যোক্তা`)}>রিমাইন্ডার</a>}
                    </td>
                  </tr>))}
                {!dues.jobs.length && <tr><td colSpan={7}>কোনো বকেয়া নেই 🎉</td></tr>}
              </tbody>
            </table></div>
            <h4>প্যাকেজের বকেয়া</h4>
            <table>
              <thead><tr><th>ক্লায়েন্ট</th><th>প্যাকেজ</th><th>মূল্য</th><th>জমা</th><th>বকেয়া</th><th></th></tr></thead>
              <tbody>
                {dues.packages.map((p: any) => (
                  <tr key={p.client._id}>
                    <td><Link href={`/clients/${p.client._id}`}>{p.client.name}</Link><br /><small>{p.client.phone}</small></td>
                    <td>📦 {p.name}{p.endDate && <><br /><small>মেয়াদ: {p.endDate}</small></>}</td>
                    <td>{tk(p.price)}</td><td>{tk(p.paid)}</td><td><b style={{ color: "#dc2626" }}>{tk(p.due)}</b></td>
                    <td><button className="btn green" style={{ padding: "4px 10px" }} onClick={() => receive(p.client._id, undefined, "package")}>টাকা নিন</button></td>
                  </tr>))}
                {!dues.packages.length && <tr><td colSpan={6}>কোনো বকেয়া নেই 🎉</td></tr>}
              </tbody>
            </table>
            <p style={{ textAlign: "right" }}><b>মোট বকেয়া: {tk(dues.total)}</b></p>
          </>
        )}
      </div>
    </>
  );
}
