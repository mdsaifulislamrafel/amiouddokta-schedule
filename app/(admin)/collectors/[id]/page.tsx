"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PAY_METHODS, tk, receiptNo, handoverNo, collectorCode, waLink, SETTLE_LABEL } from "@/lib/utils";
import { confirmReceive } from "@/components/Handover";

// একজন গ্রহণকারীর খাতা — হাতে থাকা টাকা অফিসে বুঝিয়ে দেওয়া, সব জমার তালিকা, ক্লায়েন্ট অনুযায়ী হিসাব, হ্যান্ডওভারের ইতিহাস
export default function CollectorLedger({ params }: { params: { id: string } }) {
  const today = new Date().toLocaleDateString("en-CA");
  const [d, setD] = useState<any>(null);
  const [tab, setTab] = useState("hand");
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [h, setH] = useState({ date: today, method: "Cash", trxId: "", note: "", mode: "submitted", receivedBy: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => fetch(`/api/collectors/${params.id}`).then(r => r.json()).then(setD);
  useEffect(() => { load(); setH(p => ({ ...p, receivedBy: localStorage.getItem("officeReceiver") || "" })); }, []);
  if (!d) return <p>Loading...</p>;
  if (d.error) return <p>{d.error}</p>;

  const c = d.collector, s = c.stats;
  const holding = d.payments.filter((p: any) => p.settle === "holding");
  const picked = holding.filter((p: any) => sel[p._id]);
  const pickedTotal = picked.reduce((a: number, p: any) => a + p.amount, 0);
  const allOn = holding.length > 0 && picked.length === holding.length;
  const byClient = Object.values(d.payments.reduce((m: any, p: any) => {
    const k = p.client?._id || "-";
    m[k] = m[k] || { client: p.client, total: 0, count: 0, holding: 0 };
    m[k].total += p.amount; m[k].count++; if (p.settle === "holding") m[k].holding += p.amount;
    return m;
  }, {})).sort((a: any, b: any) => b.total - a.total) as any[];
  const setF = (k: string, v: string) => setH(p => ({ ...p, [k]: v }));

  async function handover() {
    setMsg(""); setBusy(true);
    if (h.mode === "received" && h.receivedBy) localStorage.setItem("officeReceiver", h.receivedBy);
    const r = await fetch("/api/handovers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...h, status: h.mode, collectorId: c._id, paymentIds: picked.map((p: any) => p._id) }) });
    const res = await r.json(); setBusy(false);
    if (!r.ok) return setMsg("❌ " + res.error);
    setMsg(`✅ ${handoverNo(res.handoverNo)} — ${tk(res.amount)} ${res.status === "received" ? "অফিস বুঝে নিয়েছে" : "অফিসে জমা দেওয়া হয়েছে, যাচাই বাকি"}`);
    setSel({}); setH(p => ({ ...p, trxId: "", note: "" })); load();
  }
  async function cancel(x: any) {
    if (!confirm(`${handoverNo(x.handoverNo)} (${tk(x.amount)}) বাতিল করবেন? রশিদগুলো আবার ${c.name} এর হাতে দেখাবে।`)) return;
    const r = await fetch(`/api/handovers/${x._id}`, { method: "DELETE" });
    if (!r.ok) alert((await r.json()).error);
    load();
  }
  const hoText = (x: any) => `আসসালামু আলাইকুম ${c.name},\nআপনার হ্যান্ডওভার ${handoverNo(x.handoverNo)} (${x.payments.length} টি রশিদ, মোট ${tk(x.amount)}) ${x.status === "received" ? `অফিস বুঝে নিয়েছে${x.receivedBy ? ` (গ্রহণ করেছেন: ${x.receivedBy})` : ""}` : "অফিসে জমা হয়েছে, যাচাই চলছে"}।\nধন্যবাদ — আমিও উদ্যোক্তা`;

  return (
    <>
      <p style={{ marginTop: 0 }}><Link href="/collectors">← সব গ্রহণকারী</Link></p>
      <div className="card row" style={{ gap: 14 }}>
        <div className="avatar" style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#4338ca,#7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>{c.name.trim().charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{c.name} <span className="badge role">{c.designation}</span> {!c.active && <span className="badge">বন্ধ</span>}</h2>
          <div style={{ color: "#6b7280", fontSize: 14 }}>{collectorCode(c.code)} • 📞 <a href={`tel:${c.phone}`}>{c.phone}</a>{c.limit > 0 && <> • হাতে রাখার সীমা {tk(c.limit)}</>}{c.note && <> • {c.note}</>}</div>
        </div>
        <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(c.phone, `আসসালামু আলাইকুম ${c.name},\nআপনার হিসাব:\nমোট সংগ্রহ: ${tk(s.total)}\nঅফিস বুঝে নিয়েছে: ${tk(s.received)}\nযাচাই বাকি: ${tk(s.submitted)}\nআপনার হাতে আছে: ${tk(s.holding)}\n— আমিও উদ্যোক্তা`)}>WhatsApp এ হিসাব পাঠান</a>
      </div>
      <div className="stats">
        <div className="stat-card"><small>মোট সংগ্রহ ({s.count} রশিদ)</small><div className="stat">{tk(s.total)}</div><small>এই মাসে: {tk(s.monthTotal)}</small></div>
        <div className="stat-card amber"><small>হাতে আছে</small><div className="stat">{tk(s.holding)}</div>{c.limit > 0 && s.holding > c.limit && <small style={{ color: "#dc2626" }}>⚠ সীমা পার হয়েছে</small>}</div>
        <div className="stat-card" style={{ borderColor: "#2563eb" }}><small>অফিসে দিয়েছে, যাচাই বাকি</small><div className="stat">{tk(s.submitted)}</div></div>
        <div className="stat-card green"><small>অফিস বুঝে নিয়েছে</small><div className="stat">{tk(s.received)}</div></div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab ${tab === "hand" ? "on" : ""}`} onClick={() => setTab("hand")}>💼 হাতে আছে ({holding.length})</button>
          <button className={`tab ${tab === "all" ? "on" : ""}`} onClick={() => setTab("all")}>📒 সব জমা ({d.payments.length})</button>
          <button className={`tab ${tab === "clients" ? "on" : ""}`} onClick={() => setTab("clients")}>👥 ক্লায়েন্ট অনুযায়ী</button>
          <button className={`tab ${tab === "ho" ? "on" : ""}`} onClick={() => setTab("ho")}>🏢 অফিসে জমার ইতিহাস ({d.handovers.length})</button>
        </div>

        {tab === "hand" && (
          <>
            <div style={{ overflowX: "auto" }}><table>
              <thead><tr><th><input type="checkbox" checked={allOn} onChange={e => setSel(e.target.checked ? Object.fromEntries(holding.map((p: any) => [p._id, true])) : {})} /></th><th>রশিদ</th><th>তারিখ</th><th>ক্লায়েন্ট</th><th>বাবদ</th><th>মাধ্যম</th><th style={{ textAlign: "right" }}>টাকা</th></tr></thead>
              <tbody>
                {holding.map((p: any) => (
                  <tr key={p._id} onClick={() => setSel(x => ({ ...x, [p._id]: !x[p._id] }))} style={{ cursor: "pointer", background: sel[p._id] ? "#eef2ff" : undefined }}>
                    <td><input type="checkbox" checked={!!sel[p._id]} readOnly /></td>
                    <td><b>{receiptNo(p.receiptNo)}</b></td><td>{p.date}</td>
                    <td>{p.client?.name}<br /><small>{p.client?.phone}</small></td>
                    <td>{p.label}</td><td>{p.method}{p.trxId && <><br /><small>{p.trxId}</small></>}</td>
                    <td style={{ textAlign: "right" }}><b>{tk(p.amount)}</b></td>
                  </tr>))}
                {!holding.length && <tr><td colSpan={7}>এই ব্যক্তির হাতে এখন কোনো টাকা নেই ✅</td></tr>}
              </tbody>
            </table></div>
            {holding.length > 0 && (
              <div className="pay-box" style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>🏢 অফিসে টাকা বুঝিয়ে দিন — বাছাই করা {picked.length} টি রশিদ, মোট <span style={{ color: "#047857" }}>{tk(pickedTotal)}</span></h4>
                <div className="pills" style={{ marginBottom: 10 }}>
                  <button type="button" className={`pill ${h.mode === "submitted" ? "on" : ""}`} onClick={() => setF("mode", "submitted")}>📤 অফিসে দিয়েছে (অফিস পরে যাচাই করবে)</button>
                  <button type="button" className={`pill ${h.mode === "received" ? "on" : ""}`} onClick={() => setF("mode", "received")}>✔ অফিস এখনই বুঝে নিয়েছে</button>
                </div>
                <div className="grid">
                  <div><label>তারিখ</label><input type="date" className="input" value={h.date} onChange={e => setF("date", e.target.value)} /></div>
                  <div><label>কিভাবে অফিসে দিয়েছে</label><select className="input" value={h.method} onChange={e => setF("method", e.target.value)}>{PAY_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
                  {h.method !== "Cash" && <div><label>Transaction ID / রেফারেন্স</label><input className="input" value={h.trxId} onChange={e => setF("trxId", e.target.value)} /></div>}
                  {h.mode === "received" && <div><label>অফিসে কে বুঝে নিয়েছেন *</label><input className="input" value={h.receivedBy} onChange={e => setF("receivedBy", e.target.value)} /></div>}
                  <div><label>নোট</label><input className="input" value={h.note} onChange={e => setF("note", e.target.value)} /></div>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <button className="btn green" disabled={busy || !picked.length} onClick={handover}>✔ {tk(pickedTotal)} অফিসে জমা করুন</button>
                  <span>{msg}</span>
                </div>
              </div>
            )}
            {!holding.length && msg && <p>{msg}</p>}
          </>
        )}

        {tab === "all" && (
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>রশিদ</th><th>তারিখ</th><th>ক্লায়েন্ট</th><th>বাবদ</th><th>মাধ্যম</th><th>অবস্থা</th><th style={{ textAlign: "right" }}>টাকা</th></tr></thead>
            <tbody>
              {d.payments.map((p: any) => {
                const ho = d.handovers.find((x: any) => x._id === p.handover);
                return (
                  <tr key={p._id}>
                    <td><Link href={`/print/receipt/${p._id}`} target="_blank"><b>{receiptNo(p.receiptNo)}</b></Link></td><td>{p.date}</td>
                    <td>{p.client ? <Link href={`/clients/${p.client._id}`}>{p.client.name}</Link> : "-"}<br /><small>{p.client?.phone}</small></td>
                    <td>{p.label}</td><td>{p.method}</td>
                    <td><span className={`badge s-${p.settle}`}>{SETTLE_LABEL[p.settle] || "-"}</span>{ho && <><br /><small>{handoverNo(ho.handoverNo)}{ho.receivedBy && ` • ${ho.receivedBy}`}</small></>}</td>
                    <td style={{ textAlign: "right" }}><b>{tk(p.amount)}</b></td>
                  </tr>);
              })}
              {!d.payments.length && <tr><td colSpan={7}>এখনো কোনো টাকা জমা নেননি</td></tr>}
              {d.payments.length > 0 && <tr><td colSpan={6} style={{ textAlign: "right" }}><b>মোট</b></td><td style={{ textAlign: "right" }}><b>{tk(s.total)}</b></td></tr>}
            </tbody>
          </table></div>
        )}

        {tab === "clients" && (
          <table>
            <thead><tr><th>ক্লায়েন্ট</th><th>রশিদ</th><th style={{ textAlign: "right" }}>মোট দিয়েছে</th><th style={{ textAlign: "right" }}>এখনো হাতে আছে</th></tr></thead>
            <tbody>
              {byClient.map((x: any, i: number) => (
                <tr key={x.client?._id || i}>
                  <td>{x.client ? <Link href={`/clients/${x.client._id}`}>{x.client.name}</Link> : "-"}<br /><small>{x.client?.phone}</small></td>
                  <td>{x.count} টি</td><td style={{ textAlign: "right" }}><b>{tk(x.total)}</b></td>
                  <td style={{ textAlign: "right", color: x.holding ? "#b45309" : undefined }}>{tk(x.holding)}</td>
                </tr>))}
              {!byClient.length && <tr><td colSpan={4}>কোনো রেকর্ড নেই</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "ho" && (
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>স্লিপ</th><th>তারিখ</th><th>রশিদ</th><th>মাধ্যম</th><th>অবস্থা</th><th style={{ textAlign: "right" }}>টাকা</th><th></th></tr></thead>
            <tbody>
              {d.handovers.map((x: any) => (
                <tr key={x._id}>
                  <td><b>{handoverNo(x.handoverNo)}</b></td><td>{x.date}</td><td>{x.payments.length} টি</td>
                  <td>{x.method}{x.trxId && <><br /><small>{x.trxId}</small></>}</td>
                  <td><span className={`badge s-${x.status}`}>{SETTLE_LABEL[x.status]}</span>
                    {x.status === "received" && <><br /><small>গ্রহণ করেছেন: <b>{x.receivedBy}</b>{x.receivedAt && ` • ${new Date(x.receivedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}`}</small></>}
                    {x.note && <><br /><small>{x.note}</small></>}</td>
                  <td style={{ textAlign: "right" }}><b>{tk(x.amount)}</b></td>
                  <td className="row" style={{ flexWrap: "nowrap" }}>
                    {x.status === "submitted" && <button className="btn green" style={{ padding: "4px 10px" }} onClick={async () => { if (await confirmReceive(x)) load(); }}>✔ বুঝে পেয়েছি</button>}
                    <Link className="btn gray" style={{ padding: "4px 10px" }} href={`/print/handover/${x._id}`} target="_blank">স্লিপ</Link>
                    <a className="btn wa" style={{ padding: "4px 10px" }} target="_blank" rel="noreferrer" href={waLink(c.phone, hoText(x))}>WhatsApp</a>
                    <a href="#" style={{ color: "#dc2626", fontSize: 13 }} onClick={e => { e.preventDefault(); cancel(x); }}>বাতিল</a>
                  </td>
                </tr>))}
              {!d.handovers.length && <tr><td colSpan={7}>এখনো অফিসে কোনো টাকা জমা দেননি</td></tr>}
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
