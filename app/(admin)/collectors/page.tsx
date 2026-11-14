"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DESIGNATIONS, tk, collectorCode, handoverNo, waLink } from "@/lib/utils";
import { confirmReceive } from "@/components/Handover";

const blank: any = { name: "", phone: "", designation: "", limit: 0, note: "", active: true };

// টাকা গ্রহণকারী (CEO, COO, GM...) — যোগ/এডিট, প্রত্যেকের আলাদা হিসাব, অফিসের যাচাই বাকি তালিকা
export default function Collectors() {
  const [list, setList] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [f, setF] = useState<any>(blank);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const load = () => {
    fetch("/api/collectors").then(r => r.json()).then(d => Array.isArray(d) && setList(d));
    fetch("/api/handovers?status=submitted").then(r => r.json()).then(d => Array.isArray(d) && setPending(d));
  };
  useEffect(() => { load(); }, []);

  function edit(c: any) { setF({ ...blank, ...c }); setMsg(""); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function save() {
    const { stats, ...body } = f;
    const r = await fetch(f._id ? `/api/collectors/${f._id}` : "/api/collectors", { method: f._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return setMsg("❌ " + (await r.json()).error);
    setMsg("✅ সেভ হয়েছে"); setF(blank); setShowForm(false); load();
  }
  async function del(c: any) {
    if (!confirm(`"${c.name}" কে মুছবেন?`)) return;
    const r = await fetch(`/api/collectors/${c._id}`, { method: "DELETE" });
    if (!r.ok) alert((await r.json()).error);
    load();
  }

  const t = list.reduce((a, c) => ({ total: a.total + c.stats.total, holding: a.holding + c.stats.holding, submitted: a.submitted + c.stats.submitted, received: a.received + c.stats.received }), { total: 0, holding: 0, submitted: 0, received: 0 });

  return (
    <>
      <div className="stats">
        <div className="stat-card"><small>গ্রহণকারীদের মোট সংগ্রহ</small><div className="stat">{tk(t.total)}</div></div>
        <div className="stat-card amber"><small>তাদের হাতে আছে (অফিসে আসেনি)</small><div className="stat">{tk(t.holding)}</div></div>
        <div className="stat-card" style={{ borderColor: "#2563eb" }}><small>অফিসে দিয়েছে, যাচাই বাকি</small><div className="stat">{tk(t.submitted)}</div></div>
        <div className="stat-card green"><small>অফিস বুঝে নিয়েছে</small><div className="stat">{tk(t.received)}</div></div>
      </div>

      {pending.length > 0 && (
        <div className="card" style={{ borderLeft: "5px solid #2563eb" }}>
          <h3 style={{ marginTop: 0 }}>🔔 অফিসের যাচাই বাকি ({pending.length})</h3>
          <div style={{ overflowX: "auto" }}><table>
            <thead><tr><th>স্লিপ</th><th>তারিখ</th><th>কে দিয়েছে</th><th>মাধ্যম</th><th>রশিদ</th><th style={{ textAlign: "right" }}>টাকা</th><th></th></tr></thead>
            <tbody>
              {pending.map(h => (
                <tr key={h._id}>
                  <td><b>{handoverNo(h.handoverNo)}</b></td><td>{h.date}</td>
                  <td><Link href={`/collectors/${h.collector?._id}`}>{h.collector?.name}</Link> <span className="badge role">{h.collector?.designation}</span></td>
                  <td>{h.method}{h.trxId && <><br /><small>{h.trxId}</small></>}</td>
                  <td>{h.payments?.length} টি</td>
                  <td style={{ textAlign: "right" }}><b>{tk(h.amount)}</b></td>
                  <td className="row" style={{ flexWrap: "nowrap" }}>
                    <button className="btn green" style={{ padding: "4px 10px" }} onClick={async () => { if (await confirmReceive(h)) load(); }}>✔ টাকা বুঝে পেয়েছি</button>
                    <Link className="btn gray" style={{ padding: "4px 10px" }} href={`/print/handover/${h._id}`} target="_blank">স্লিপ</Link>
                  </td>
                </tr>))}
            </tbody>
          </table></div>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>👤 টাকা গ্রহণকারী ({list.length})</h3>
          {!showForm && <button className="btn" onClick={() => { setF(blank); setMsg(""); setShowForm(true); }}>+ নতুন গ্রহণকারী</button>}
        </div>
        {showForm && (
          <div className="pay-box" style={{ marginTop: 12 }}>
            <h4 style={{ marginTop: 0 }}>{f._id ? `এডিট: ${collectorCode(f.code)}` : "নতুন গ্রহণকারী যোগ করুন"}</h4>
            <div className="grid">
              <div><label>নাম *</label><input className="input" value={f.name} onChange={e => set("name", e.target.value)} /></div>
              <div><label>ফোন নাম্বার *</label><input className="input" placeholder="01XXXXXXXXX" value={f.phone} onChange={e => set("phone", e.target.value)} /></div>
              <div><label>কোম্পানিতে দায়িত্ব / পদবি *</label><input className="input" list="desig" placeholder="যেমন: CEO, COO, GM" value={f.designation} onChange={e => set("designation", e.target.value)} />
                <datalist id="desig">{DESIGNATIONS.map(d => <option key={d} value={d} />)}</datalist></div>
              <div><label>হাতে সর্বোচ্চ রাখতে পারবে (৳, 0 = সীমা নেই)</label><input type="number" min={0} className="input" value={f.limit ?? 0} onChange={e => set("limit", Number(e.target.value))} /></div>
            </div>
            <div className="pills" style={{ margin: "8px 0" }}>
              {DESIGNATIONS.map(d => <button type="button" key={d} className={`pill ${f.designation === d ? "on" : ""}`} onClick={() => set("designation", d)}>{d}</button>)}
            </div>
            <label>নোট</label><input className="input" value={f.note || ""} onChange={e => set("note", e.target.value)} />
            <label style={{ marginTop: 10 }}><input type="checkbox" checked={!!f.active} onChange={e => set("active", e.target.checked)} /> চালু আছে (টাকা জমা নেওয়ার সময় তালিকায় দেখাবে)</label>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={save}>{f._id ? "আপডেট করুন" : "যোগ করুন"}</button>
              <button className="btn gray" onClick={() => { setF(blank); setShowForm(false); setMsg(""); }}>বাতিল</button>
              <span>{msg}</span>
            </div>
          </div>
        )}
        {!showForm && msg && <p>{msg}</p>}
      </div>

      <div className="cgrid">
        {list.map(c => {
          const s = c.stats, over = c.limit > 0 && s.holding > c.limit;
          return (
            <div key={c._id} className={`ccard ${c.active ? "" : "off"}`}>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <div className="avatar">{(c.name || "?").trim().charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/collectors/${c._id}`}><b style={{ fontSize: 16 }}>{c.name}</b></Link>
                  <div className="row" style={{ gap: 4 }}><span className="badge role">{c.designation}</span><small style={{ color: "#6b7280" }}>{collectorCode(c.code)}</small>{!c.active && <span className="badge">বন্ধ</span>}</div>
                </div>
              </div>
              <div style={{ fontSize: 13 }}>📞 <a href={`tel:${c.phone}`}>{c.phone}</a> &nbsp;|&nbsp; <a href={waLink(c.phone, `আসসালামু আলাইকুম ${c.name}, আপনার কাছে ক্লায়েন্টদের জমা দেওয়া ${tk(s.holding)} এখনো অফিসে জমা হয়নি। অনুগ্রহ করে অফিসে বুঝিয়ে দিন। — আমিও উদ্যোক্তা`)} target="_blank" rel="noreferrer" style={{ color: "#16a34a" }}>WhatsApp</a></div>
              <div className="cnums">
                <div><small>মোট সংগ্রহ ({s.count} রশিদ)</small><b>{tk(s.total)}</b></div>
                <div><small>এই মাসে</small><b>{tk(s.monthTotal)}</b></div>
                <div className="hold"><small>হাতে আছে</small><b>{tk(s.holding)}</b></div>
                <div className="sub"><small>যাচাই বাকি</small><b>{tk(s.submitted)}</b></div>
                <div className="ok" style={{ gridColumn: "span 2" }}><small>অফিস বুঝে নিয়েছে</small><b>{tk(s.received)}</b></div>
              </div>
              {s.total > 0 && <div className="bar" title="অফিসে পৌঁছেছে"><div style={{ width: `${Math.round((s.received / s.total) * 100)}%` }} /></div>}
              {over && <div className="warn">⚠ হাতে রাখার সীমা ({tk(c.limit)}) পার হয়েছে — দ্রুত অফিসে জমা দিতে বলুন</div>}
              {c.note && <small style={{ color: "#6b7280" }}>{c.note}</small>}
              <div className="row" style={{ marginTop: "auto" }}>
                <Link className="btn" style={{ padding: "4px 10px" }} href={`/collectors/${c._id}`}>খাতা / অফিসে জমা</Link>
                <button className="btn gray" style={{ padding: "4px 10px" }} onClick={() => edit(c)}>এডিট</button>
                {s.count === 0 && <button className="btn red" style={{ padding: "4px 10px" }} onClick={() => del(c)}>মুছুন</button>}
              </div>
            </div>
          );
        })}
        {!list.length && <div className="card">এখনো কোনো টাকা গ্রহণকারী নেই। উপরের &quot;+ নতুন গ্রহণকারী&quot; বাটনে ক্লিক করে যোগ করুন।</div>}
      </div>
    </>
  );
}
