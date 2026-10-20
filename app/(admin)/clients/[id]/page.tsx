"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtDur, fmt12, STATUS_LABEL } from "@/lib/utils";

export default function ClientPage({ params }: { params: { id: string } }) {
  const today = new Date().toLocaleDateString("en-CA");
  const [d, setD] = useState<any>(null);
  const [c, setC] = useState<any>(null);
  const [msg, setMsg] = useState(""); const [smsg, setSmsg] = useState("");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [onlyMonth, setOnlyMonth] = useState(false);
  const [sf, setSf] = useState({ jobId: "", date: today, start: "", end: "", note: "" });
  const load = () => fetch(`/api/clients/${params.id}`).then(r => r.json()).then(x => { setD(x); setC({ ...x.client, altText: (x.client.altPhones || []).join(", "), pkg: x.client.pkg || {} }); });
  useEffect(() => { load(); }, []);
  if (!d || !c) return <p>লোড হচ্ছে...</p>;

  const setP = (k: string, v: any) => setC({ ...c, pkg: { ...c.pkg, [k]: v } });
  async function save() {
    const body = { name: c.name, phone: c.phone, isMember: c.isMember, notes: c.notes, pkg: c.pkg, altPhones: c.altText.split(",").map((s: string) => s.trim()).filter(Boolean) };
    const r = await fetch(`/api/clients/${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(r.ok ? "✅ সেভ হয়েছে" : "❌ " + (await r.json()).error); if (r.ok) load();
  }
  const openJobs = d.jobs.filter((j: any) => !["delivered", "rejected"].includes(j.status));
  const jobId = sf.jobId || openJobs[0]?._id || "";
  async function addSession() {
    setSmsg("");
    const r = await fetch(`/api/jobs/${jobId}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: sf.date, start: sf.start, end: sf.end, note: sf.note }) });
    if (!r.ok) return setSmsg("❌ " + (await r.json()).error);
    setSf({ ...sf, jobId, start: "", end: "", note: "" }); setSmsg("✅ সেশন যোগ হয়েছে"); load();
  }
  async function delSession(row: any) {
    if (!confirm("এই সেশন মুছবেন?")) return;
    const r = await fetch(`/api/jobs/${row.jobId}/sessions?sid=${row.sid}`, { method: "DELETE" });
    if (!r.ok) alert((await r.json()).error); load();
  }

  const allowed = (c.pkg.monthlyHours || 0) * 60;
  const used = d.usage[month] || 0;
  const pct = allowed ? Math.min(100, (used / allowed) * 100) : 0;
  const rows = d.ledger.filter((r: any) => !onlyMonth || r.date.startsWith(month));

  return (
    <>
      <div className="card">
        <div className="row"><h3 style={{ margin: 0 }}>{c.name} {c.isMember && <span className="badge vip">Premium Member</span>}</h3>
          <span style={{ marginLeft: "auto" }} className="row">
            <Link className="btn" href={`/jobs/new?clientId=${params.id}`}>+ নতুন কাজ (নতুন ডিল)</Link>
            <Link className="btn gray" href={`/print/client/${params.id}`} target="_blank">শিডিউল প্রিন্ট</Link></span></div>
        <div className="grid" style={{ marginTop: 12 }}>
          <div><label>নাম</label><input className="input" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></div>
          <div><label>ফোন</label><input className="input" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} /></div>
          <div><label>অন্য নাম্বার (কমা দিয়ে)</label><input className="input" value={c.altText} onChange={e => setC({ ...c, altText: e.target.value })} /></div>
          <div><label>নোট</label><input className="input" value={c.notes || ""} onChange={e => setC({ ...c, notes: e.target.value })} /></div>
        </div>
        <label style={{ marginTop: 12 }}><input type="checkbox" checked={c.isMember} onChange={e => setC({ ...c, isMember: e.target.checked })} /> Premium Member (প্যাকেজ)</label>
        {c.isMember && (
          <div className="grid">
            <div><label>প্যাকেজের নাম</label><input className="input" value={c.pkg.name || ""} onChange={e => setP("name", e.target.value)} /></div>
            <div><label>প্যাকেজ মূল্য (টাকা)</label><input type="number" className="input" value={c.pkg.price || ""} onChange={e => setP("price", Number(e.target.value))} /></div>
            <div><label>মাসে মোট ঘন্টা</label><input type="number" className="input" value={c.pkg.monthlyHours || ""} onChange={e => setP("monthlyHours", Number(e.target.value))} /></div>
            <div><label>শুরুর তারিখ</label><input type="date" className="input" value={c.pkg.startDate || ""} onChange={e => setP("startDate", e.target.value)} /></div>
            <div><label>শেষের তারিখ</label><input type="date" className="input" value={c.pkg.endDate || ""} onChange={e => setP("endDate", e.target.value)} /></div>
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={save}>সেভ</button><span>{msg}</span></div>
      </div>

      <div className="card">
        <h3>⏱ নতুন দিনের সেশন যোগ করুন</h3>
        {!openJobs.length ? <p>এই ক্লায়েন্টের কোনো চলমান কাজ নেই। <Link href={`/jobs/new?clientId=${params.id}`}>নতুন কাজ খুলুন</Link>।</p> : (
          <>
            <div className="grid">
              <div><label>কোন কাজে যোগ হবে</label>
                <select className="input" value={jobId} onChange={e => setSf({ ...sf, jobId: e.target.value })}>
                  {openJobs.map((j: any) => <option key={j._id} value={j._id}>{j.serviceType} • {j.date} • {STATUS_LABEL[j.status]} • মোট {fmtDur(j.durationMinutes || 0)}</option>)}
                </select></div>
              <div><label>তারিখ</label><input type="date" className="input" value={sf.date} onChange={e => setSf({ ...sf, date: e.target.value })} /></div>
              <div><label>শুরু</label><input type="time" className="input" value={sf.start} onChange={e => setSf({ ...sf, start: e.target.value })} /></div>
              <div><label>শেষ</label><input type="time" className="input" value={sf.end} onChange={e => setSf({ ...sf, end: e.target.value })} /></div>
              <div><label>নোট</label><input className="input" value={sf.note} onChange={e => setSf({ ...sf, note: e.target.value })} /></div>
            </div>
            <div className="row" style={{ marginTop: 8 }}><button className="btn" onClick={addSession}>+ সেশন যোগ করুন</button><span>{smsg}</span></div>
          </>
        )}
      </div>

      {c.isMember && (
        <div className="card">
          <div className="row"><h3 style={{ margin: 0 }}>প্যাকেজ ব্যবহার</h3><input type="month" className="input" style={{ maxWidth: 170 }} value={month} onChange={e => setMonth(e.target.value)} /></div>
          <div className="bar" style={{ marginTop: 10 }}><div style={{ width: pct + "%", background: used > allowed && allowed ? "#dc2626" : undefined }} /></div>
          <p>ব্যবহার: <b>{fmtDur(used)}</b> / {c.pkg.monthlyHours || 0} ঘন্টা — বাকি: <b>{fmtDur(Math.max(0, allowed - used))}</b>{used > allowed && allowed > 0 && <span style={{ color: "#dc2626" }}> (প্যাকেজের চেয়ে {fmtDur(used - allowed)} বেশি)</span>}</p>
          <table><thead><tr><th>মাস</th><th>মোট ব্যবহার</th><th>বাকি</th></tr></thead>
            <tbody>{Object.entries(d.usage).sort().reverse().map(([m, v]: any) => <tr key={m}><td>{m}</td><td>{fmtDur(v)}</td><td>{allowed ? fmtDur(Math.max(0, allowed - v)) : "-"}</td></tr>)}</tbody></table>
          <p>প্যাকেজ-বহির্ভূত এক্সট্রা সার্ভিস: মোট <b>{d.extraCharge}</b> টাকা, পেয়েছি <b>{d.extraPaid}</b> টাকা, বকেয়া <b>{d.extraCharge - d.extraPaid}</b> টাকা</p>
        </div>
      )}

      <div className="card">
        <div className="row"><h3 style={{ margin: 0 }}>সব শুটিং সেশন (মোট {fmtDur(d.totalMinutes)})</h3>
          <label style={{ margin: "0 0 0 auto" }}><input type="checkbox" checked={onlyMonth} onChange={e => setOnlyMonth(e.target.checked)} /> শুধু {month} মাস</label></div>
        <table>
          <thead><tr><th>তারিখ</th><th>সার্ভিস</th><th>সময়</th><th>মোট</th><th>ধরন</th><th>নোট</th><th></th></tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i}><td>{r.date}</td><td>{r.serviceType}</td><td>{fmt12(r.start)} - {fmt12(r.end)}</td><td>{fmtDur(r.minutes)}</td><td>{r.usePackage ? "প্যাকেজ" : "এক্সট্রা"}</td><td>{r.note}</td>
                <td><Link href={`/jobs/${r.jobId}`}>কাজ</Link>{r.sid && !r.locked && <> | <a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); delSession(r); }}>মুছুন</a></>}</td></tr>
            ))}
            {!rows.length && <tr><td colSpan={7}>কোনো সেশন নেই</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>সব কাজ (ডিল)</h3>
        <table>
          <thead><tr><th>শুরুর তারিখ</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মোট সময়</th><th>ধরন</th><th>চার্জ</th><th></th></tr></thead>
          <tbody>{d.jobs.map((j: any) => (
            <tr key={j._id}><td>{j.date}</td><td>{j.serviceType}</td><td><span className={`badge ${j.status}`}>{STATUS_LABEL[j.status]}</span></td><td>{fmtDur(j.durationMinutes || 0)}</td>
              <td>{j.usePackage ? "প্যাকেজ" : "এক্সট্রা"}</td><td>{j.charge}</td><td><Link href={`/jobs/${j._id}`}>খুলুন</Link></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
