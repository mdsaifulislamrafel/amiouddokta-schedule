"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtDur, fmt12, statusLabel, billingLabel, pkgSummary, addMonths, tk } from "@/lib/utils";
import ReceivePayment, { PaymentList } from "@/components/ReceivePayment";

const lines = (t: string) => (t || "").split("\n").map(s => s.trim()).filter(Boolean);

export default function ClientPage({ params }: { params: { id: string } }) {
  const today = new Date().toLocaleDateString("en-CA");
  const [d, setD] = useState<any>(null);
  const [c, setC] = useState<any>(null);
  const [pkgs, setPkgs] = useState<any[]>([]);
  const [msg, setMsg] = useState(""); const [smsg, setSmsg] = useState("");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [onlyMonth, setOnlyMonth] = useState(false);
  const [payKey, setPayKey] = useState(0);
  const [sf, setSf] = useState({ jobId: "", date: today, start: "", end: "", note: "" });
  const load = () => fetch(`/api/clients/${params.id}`).then(r => r.json()).then(x => {
    const p = x.client.pkg || {};
    setD(x);
    setC({ ...x.client, altText: (x.client.altPhones || []).join(", "), pkg: { hoursPeriod: "month", ...p, featuresText: (p.features || []).join("\n"), termsText: (p.terms || []).join("\n") } });
  });
  useEffect(() => { load(); fetch("/api/packages?active=1").then(r => r.json()).then(setPkgs); }, []);
  if (!d || !c) return <p>লোড হচ্ছে...</p>;

  const setP = (k: string, v: any) => setC({ ...c, pkg: { ...c.pkg, [k]: v } });
  // টেমপ্লেট থেকে প্যাকেজ কপি — চাইলে পরে এই ক্লায়েন্টের জন্য আলাদা করে বদলানো যাবে
  function applyTemplate(pid: string) {
    const t = pkgs.find(p => p._id === pid);
    if (!t) return;
    const start = c.pkg.startDate || today;
    setC({ ...c, isMember: true, pkg: {
      ...c.pkg, packageId: t._id, name: t.name, serviceType: t.serviceType, price: t.price, monthlyHours: t.hours, hoursPeriod: t.hoursPeriod || "month",
      credit: t.credit || 0, startDate: start, endDate: addMonths(start, t.durationMonths || 1),
      featuresText: (t.features || []).join("\n"), termsText: (t.terms || []).join("\n"),
    } });
  }
  async function save() {
    const { featuresText, termsText, ...pkg } = c.pkg;
    const body = { name: c.name, phone: c.phone, isMember: c.isMember, notes: c.notes, pkg: { ...pkg, features: lines(featuresText), terms: lines(termsText) }, altPhones: c.altText.split(",").map((s: string) => s.trim()).filter(Boolean) };
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

  const ps = pkgSummary(d, month);
  const pct = ps.allowed ? Math.min(100, (ps.used / ps.allowed) * 100) : 0;
  const rows = d.ledger.filter((r: any) => !onlyMonth || r.date.startsWith(month));
  const saved = d.client.pkg || {};

  return (
    <>
      <div className="card">
        <div className="row"><h3 style={{ margin: 0 }}>{c.name} {c.isMember && <span className="badge vip">Premium Member</span>}</h3>
          <span style={{ marginLeft: "auto" }} className="row">
            <Link className="btn" href={`/jobs/new?clientId=${params.id}`}>+ নতুন কাজ (নতুন ডিল)</Link>
            <Link className="btn" href={`/jobs/new?type=edit&clientId=${params.id}`}>+ এডিটের কাজ (বাইরের ফুটেজ)</Link>
            <Link className="btn gray" href={`/print/client/${params.id}`} target="_blank">শিডিউল প্রিন্ট</Link>
            {d.client.isMember && saved.name && <Link className="btn gray" href={`/print/package/${params.id}`} target="_blank">প্যাকেজ Agreement</Link>}
          </span></div>
        <div className="grid" style={{ marginTop: 12 }}>
          <div><label>নাম</label><input className="input" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} /></div>
          <div><label>ফোন</label><input className="input" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} /></div>
          <div><label>অন্য নাম্বার (কমা দিয়ে)</label><input className="input" value={c.altText} onChange={e => setC({ ...c, altText: e.target.value })} /></div>
          <div><label>নোট</label><input className="input" value={c.notes || ""} onChange={e => setC({ ...c, notes: e.target.value })} /></div>
        </div>
        <label style={{ marginTop: 12 }}><input type="checkbox" checked={c.isMember} onChange={e => setC({ ...c, isMember: e.target.checked })} /> Premium Member (প্যাকেজ)</label>
        {c.isMember && (
          <>
            <div className="row" style={{ margin: "6px 0 10px" }}>
              <select className="input" style={{ maxWidth: 360 }} value="" onChange={e => applyTemplate(e.target.value)}>
                <option value="">-- তৈরি করা প্যাকেজ থেকে বাছাই করুন --</option>
                {pkgs.map(p => <option key={p._id} value={p._id}>{p.name} — ৳{p.price} — {p.hours} ঘন্টা{p.hoursPeriod === "total" ? " (মোট)" : "/মাস"}</option>)}
              </select>
              <Link href="/packages">প্যাকেজ বানান / এডিট</Link>
            </div>
            <div className="grid">
              <div><label>প্যাকেজের নাম</label><input className="input" value={c.pkg.name || ""} onChange={e => setP("name", e.target.value)} /></div>
              <div><label>প্যাকেজ মূল্য (টাকা)</label><input type="number" className="input" value={c.pkg.price || ""} onChange={e => setP("price", Number(e.target.value))} /></div>
              <div><label>প্যাকেজের টাকা পেয়েছি (রশিদ থেকে)</label><div className="input" style={{ background: "#f3f4f6" }}>{tk(saved.paid)} | বকেয়া {tk((saved.price || 0) - (saved.paid || 0))} — <a href="#pay">টাকা নিন ↓</a></div></div>
              <div><label>মোট ঘন্টা</label><input type="number" className="input" value={c.pkg.monthlyHours || ""} onChange={e => setP("monthlyHours", Number(e.target.value))} /></div>
              <div><label>ঘন্টার হিসাব</label><select className="input" value={c.pkg.hoursPeriod || "month"} onChange={e => setP("hoursPeriod", e.target.value)}><option value="month">প্রতি মাসে</option><option value="total">পুরো মেয়াদে মোট</option></select></div>
              <div><label>টাকার ব্যালেন্স (অন্য কাজে খরচযোগ্য)</label><input type="number" className="input" value={c.pkg.credit || ""} onChange={e => setP("credit", Number(e.target.value))} /></div>
              <div><label>শুরুর তারিখ</label><input type="date" className="input" value={c.pkg.startDate || ""} onChange={e => setP("startDate", e.target.value)} /></div>
              <div><label>শেষের তারিখ</label><input type="date" className="input" value={c.pkg.endDate || ""} onChange={e => setP("endDate", e.target.value)} /></div>
            </div>
            <div className="grid" style={{ marginTop: 10 }}>
              <div><label>প্যাকেজের সুবিধা (প্রতি লাইনে একটি)</label><textarea className="input" rows={5} value={c.pkg.featuresText} onChange={e => setP("featuresText", e.target.value)} /></div>
              <div><label>এগ্রিমেন্টের শর্ত (প্রতি লাইনে একটি)</label><textarea className="input" rows={5} value={c.pkg.termsText} onChange={e => setP("termsText", e.target.value)} /></div>
            </div>
          </>
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
                  {openJobs.map((j: any) => <option key={j._id} value={j._id}>{j.jobType === "edit" ? "✂ " : ""}{j.serviceType} • {j.date} • {statusLabel(j.status, j.jobType)} • মোট {fmtDur(j.durationMinutes || 0)}</option>)}
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

      {d.client.isMember && (
        <div className="card">
          <div className="row"><h3 style={{ margin: 0 }}>প্যাকেজ ব্যবহার — {saved.name || "-"}</h3>{!ps.total && <input type="month" className="input" style={{ maxWidth: 170 }} value={month} onChange={e => setMonth(e.target.value)} />}</div>
          {saved.endDate && <p style={{ margin: "6px 0" }}>মেয়াদ: {saved.startDate || "?"} → {saved.endDate} {saved.endDate < today && <span style={{ color: "#dc2626" }}>(মেয়াদ শেষ)</span>} | প্যাকেজ মূল্য: ৳{saved.price || 0}, পেয়েছি: ৳{saved.paid || 0}, বকেয়া: ৳{(saved.price || 0) - (saved.paid || 0)}</p>}
          <div className="bar" style={{ marginTop: 10 }}><div style={{ width: pct + "%", background: ps.over ? "#dc2626" : undefined }} /></div>
          <p>ঘন্টা ({ps.periodText}): <b>{fmtDur(ps.used)}</b> / {saved.monthlyHours || 0} ঘন্টা — বাকি: <b>{fmtDur(ps.left)}</b>{ps.over > 0 && <span style={{ color: "#dc2626" }}> (প্যাকেজের চেয়ে {fmtDur(ps.over)} বেশি)</span>}</p>
          {ps.credit > 0 && <p>টাকার ব্যালেন্স: খরচ <b>৳{ps.moneyUsed}</b> / ৳{ps.credit} — বাকি: <b style={{ color: ps.moneyLeft < 0 ? "#dc2626" : undefined }}>৳{ps.moneyLeft}</b></p>}
          {!ps.total && (
            <table><thead><tr><th>মাস</th><th>ঘন্টা থেকে ব্যবহার</th><th>বাকি</th></tr></thead>
              <tbody>{Object.entries(d.usage).sort().reverse().map(([m, v]: any) => <tr key={m}><td>{m}</td><td>{fmtDur(v)}</td><td>{ps.allowed ? fmtDur(Math.max(0, ps.allowed - v)) : "-"}</td></tr>)}</tbody></table>
          )}
          {d.moneyJobs.length > 0 && (
            <>
              <h4 style={{ marginBottom: 4 }}>প্যাকেজের টাকা থেকে কাটা কাজ</h4>
              <table><thead><tr><th>তারিখ</th><th>কাজ</th><th>টাকা</th><th></th></tr></thead>
                <tbody>{d.moneyJobs.map((j: any) => <tr key={j._id}><td>{j.date}</td><td>{j.jobType === "edit" && "✂ "}{j.serviceType}{j.title ? ` — ${j.title}` : ""}</td><td>৳{j.charge || 0}</td><td><Link href={`/jobs/${j._id}`}>খুলুন</Link></td></tr>)}</tbody></table>
            </>
          )}
          <p>প্যাকেজ-বহির্ভূত এক্সট্রা সার্ভিস: মোট <b>{d.extraCharge}</b> টাকা, পেয়েছি <b>{d.extraPaid}</b> টাকা, বকেয়া <b>{d.extraCharge - d.extraPaid}</b> টাকা</p>
        </div>
      )}

      <div className="card">
        <div className="row"><h3 style={{ margin: 0 }}>সব সেশন — শুটিং ও এডিটিং (মোট {fmtDur(d.totalMinutes)})</h3>
          <label style={{ margin: "0 0 0 auto" }}><input type="checkbox" checked={onlyMonth} onChange={e => setOnlyMonth(e.target.checked)} /> শুধু {month} মাস</label></div>
        <table>
          <thead><tr><th>তারিখ</th><th>সার্ভিস</th><th>সময়</th><th>মোট</th><th>ধরন</th><th>নোট</th><th></th></tr></thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i}><td>{r.date}</td><td>{r.jobType === "edit" && "✂ "}{r.serviceType}</td><td>{r.start ? `${fmt12(r.start)} - ${fmt12(r.end)}` : "-"}</td><td>{fmtDur(r.minutes)}</td><td>{billingLabel(r)}</td><td>{r.note}</td>
                <td><Link href={`/jobs/${r.jobId}`}>কাজ</Link>{r.sid && <> | <a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); delSession(r); }}>মুছুন</a></>}</td></tr>
            ))}
            {!rows.length && <tr><td colSpan={7}>কোনো সেশন নেই</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card" id="pay">
        <h3>💰 টাকা জমা নিন</h3>
        <ReceivePayment clientId={params.id} onDone={() => { setPayKey(k => k + 1); load(); }} />
        <h4 style={{ marginBottom: 4 }}>জমার ইতিহাস (মানি রিসিট)</h4>
        <PaymentList query={`clientId=${params.id}`} reloadKey={payKey} onChange={load} />
      </div>

      <div className="card">
        <h3>সব কাজ (ডিল)</h3>
        <table>
          <thead><tr><th>শুরুর তারিখ</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মোট সময়</th><th>ধরন</th><th>চার্জ</th><th>জমা / বকেয়া</th><th></th></tr></thead>
          <tbody>{d.jobs.map((j: any) => (
            <tr key={j._id}><td>{j.date}</td><td>{j.jobType === "edit" && <span className="badge edit">✂ এডিট</span>} {j.serviceType}</td><td><span className={`badge ${j.status}`}>{statusLabel(j.status, j.jobType)}</span></td><td>{fmtDur(j.durationMinutes || 0)}</td>
              <td>{billingLabel(j)}{j.packageName && <><br /><small>📦 {j.packageName}</small></>}</td><td>{j.charge}</td>
              <td>{j.usePackage && j.deductFrom === "money" ? "-" : <>{tk(j.paid)} / <b style={{ color: (j.charge || 0) - (j.paid || 0) > 0 ? "#dc2626" : "#059669" }}>{tk((j.charge || 0) - (j.paid || 0))}</b></>}</td><td><Link href={`/jobs/${j._id}`}>খুলুন</Link></td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
