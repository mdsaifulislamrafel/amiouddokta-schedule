"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SERVICES, EDIT_SERVICES, FOOTAGE_SOURCE, calcMinutes, fmtDur, fmt12, statusLabel, pkgSummary } from "@/lib/utils";

const empty: any = { jobType: "shoot", footageSource: "client_self", flinks: "", footageNote: "", deductFrom: "hours", clientId: "", newName: "", newPhone: "", deliveryPhone: "", serviceType: SERVICES[0], title: "", date: "", startTime: "", endTime: "", assignedTo: "", location: "Office", charge: 0, paid: 0, usePackage: false, expectedDeliveryDate: "", deliveryEstimate: "", links: "", deliveryNote: "", optionalNote: "", status: "pending", sessions: [] };

// টাইপ করে সার্চ করা যায় এমন ক্লায়েন্ট সিলেক্টর
function ClientPicker({ clients, value, onChange }: { clients: any[]; value: string; onChange: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const selected = clients.find(c => c._id === value);
  const label = (c: any) => `${c.name} (${c.phone})${c.isMember ? " ★ Member" : ""}`;

  // বাইরে ক্লিক করলে লিস্ট বন্ধ
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const term = q.trim().toLowerCase();
  const list = (term
    ? clients.filter(c => (c.name || "").toLowerCase().includes(term) || (c.phone || "").includes(term))
    : clients
  ).slice(0, 50);

  const pick = (c: any) => { onChange(c._id); setQ(""); setOpen(false); };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi(h => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (open && list[hi]) { e.preventDefault(); pick(list[hi]); } }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        className="input"
        placeholder="-- নাম বা ফোন নাম্বার টাইপ করুন --"
        value={open ? q : (selected ? label(selected) : "")}
        onFocus={() => { setOpen(true); setQ(""); setHi(0); }}
        onChange={e => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={onKey}
      />
      {value && (
        <button type="button" onClick={() => { onChange(""); setQ(""); }} title="মুছুন"
          style={{ position: "absolute", right: 8, top: 6, border: 0, background: "transparent", cursor: "pointer", fontSize: 16 }}>✕</button>
      )}
      {open && (
        <div style={{ position: "absolute", zIndex: 50, left: 0, right: 0, maxHeight: 260, overflowY: "auto", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.12)", marginTop: 2 }}>
          {list.map((c, i) => (
            <div key={c._id} onMouseDown={e => { e.preventDefault(); pick(c); }} onMouseEnter={() => setHi(i)}
              style={{ padding: "8px 10px", cursor: "pointer", background: i === hi ? "#eef2ff" : "#fff", fontWeight: c._id === value ? 700 : 400 }}>
              {label(c)}
            </div>
          ))}
          {!list.length && <div style={{ padding: "8px 10px", color: "#6b7280" }}>কোনো ক্লায়েন্ট পাওয়া যায়নি</div>}
        </div>
      )}
    </div>
  );
}

export default function JobEditor({ id }: { id?: string }) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-CA");
  const [f, setF] = useState<any>(empty);
  const [clients, setClients] = useState<any[]>([]);
  const [cd, setCd] = useState<any>(null); // নির্বাচিত ক্লায়েন্টের আগের ডেটা
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [ss, setSs] = useState({ date: today, start: "", end: "", h: "", m: "", note: "" });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const load = (j: any) => setF({ ...empty, ...j, jobType: j.jobType || "shoot", deductFrom: j.deductFrom || "hours", clientId: j.client?._id || "", links: (j.driveLinks || []).join("\n"), flinks: (j.footageLinks || []).join("\n") });
  const loadClient = (cid: string) => fetch(`/api/clients/${cid}`).then(r => r.json()).then(x => setCd(x.client ? x : null));

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(setClients);
    if (id) fetch(`/api/jobs/${id}`).then(r => r.json()).then(load);
    else {
      const sp = new URLSearchParams(location.search);
      const c = sp.get("clientId"); if (c) set("clientId", c);
      if (sp.get("type") === "edit") setF((p: any) => ({ ...p, jobType: "edit", serviceType: EDIT_SERVICES[0], location: "" }));
    }
  }, [id]);
  // ক্লায়েন্ট সিলেক্ট করলেই আগের কাজ/হিসাব অটো আসবে
  useEffect(() => { if (f.clientId && !isNew) loadClient(f.clientId); else setCd(null); }, [f.clientId, isNew]);

  const isEdit = f.jobType === "edit";
  const services = isEdit ? EDIT_SERVICES : SERVICES;
  function setType(t: string) {
    setF((p: any) => ({ ...p, jobType: t, _other: false, serviceType: (t === "edit" ? EDIT_SERVICES : SERVICES)[0], location: t === "edit" ? "" : p.location || "Office" }));
  }

  async function send(action?: string) {
    setMsg("");
    const lines = (t: string) => (t || "").split("\n").map((s: string) => s.trim()).filter(Boolean);
    const body: any = { ...f, action, driveLinks: lines(f.links), footageLinks: lines(f.flinks) };
    delete body.sessions;
    if (isNew) body.clientId = ""; else { delete body.newName; delete body.newPhone; }
    const r = await fetch(id ? `/api/jobs/${id}` : "/api/jobs", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) return setMsg("❌ " + d.error);
    if (!id) return router.push(`/jobs/${d._id}`);
    load(d); setMsg("✅ সেভ হয়েছে");
    if (d.client?._id) loadClient(d.client._id);
  }
  async function del() {
    if (!confirm(f.status === "delivered" ? "কাজটি ডেলিভারি হয়ে গেছে। তবুও মুছে ফেলবেন?" : "এই কাজটি মুছে ফেলবেন?")) return;
    const r = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/jobs"); else setMsg("❌ " + (await r.json()).error);
  }
  async function afterSession(r: Response) {
    const d = await r.json();
    if (!r.ok) return setMsg("❌ " + d.error);
    setF((p: any) => ({ ...p, sessions: d.sessions, durationMinutes: d.durationMinutes })); // অন্য এডিট নষ্ট হবে না
    setMsg("✅ সেশন আপডেট হয়েছে");
    if (f.clientId) loadClient(f.clientId);
  }
  const addSession = async () => {
    setMsg("");
    const minutes = (Number(ss.h) || 0) * 60 + (Number(ss.m) || 0);
    await afterSession(await fetch(`/api/jobs/${id}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: ss.date, start: ss.start, end: ss.end, note: ss.note, minutes }) }));
    setSs(p => ({ ...p, start: "", end: "", h: "", m: "", note: "" }));
  };
  const delSession = async (sid: string) => { if (confirm("এই সেশন মুছবেন?")) await afterSession(await fetch(`/api/jobs/${id}/sessions?sid=${sid}`, { method: "DELETE" })); };

  const delivered = !!id && f.status === "delivered";
  const planned = calcMinutes(f.startTime, f.endTime);
  const total = (f.sessions || []).reduce((a: number, s: any) => a + (s.minutes || 0), 0);
  const sessionPreview = calcMinutes(ss.start, ss.end) ?? (((Number(ss.h) || 0) * 60 + (Number(ss.m) || 0)) || null);
  const field = (label: string, k: string, type = "text") => (<div><label>{label}</label><input className="input" type={type} value={f[k] ?? ""} onChange={e => set(k, type === "number" ? Number(e.target.value) : e.target.value)} /></div>);

  const month = today.slice(0, 7);
  const ps = pkgSummary(cd, month);
  const member = !!cd?.client?.isMember;
  const prevJobs = (cd?.jobs || []).filter((j: any) => j._id !== id);
  const workWord = isEdit ? "এডিটিং" : "শুটিং";

  return (
    <>
      {id && (
        <div className="card row">
          {isEdit && <span className="badge edit">✂ শুধু এডিট</span>}
          <span className={`badge ${f.status}`}>{statusLabel(f.status, f.jobType)}</span>
          {f.status === "pending" && <><button className="btn green" onClick={() => send("approve")}>{isEdit ? "✔ এডিটের কাজ গ্রহণ (Approve)" : "✔ কাজটি অফিসে করার Approve"}</button><button className="btn red" onClick={() => send("reject")}>Reject</button></>}
          {f.status === "approved" && <button className="btn green" onClick={() => send("complete")}>{isEdit ? "✔ এডিট সম্পন্ন" : "✔ কাজ সম্পন্ন (সব শুট শেষ)"}</button>}
          {f.status === "completed" && <button className="btn green" onClick={() => send("deliver")}>✔ ডেলিভারি Approve (Drive লিংক লাগবে)</button>}
          {delivered && <button className="btn gray" onClick={() => confirm("কাজটি আবার 'ডেলিভারি বাকি' অবস্থায় যাবে (রিভিশন/সংশোধনের জন্য)। ঠিক আছে?") && send("reopen")}>↺ আবার চালু করুন (রিভিশন)</button>}
          <span style={{ marginLeft: "auto" }} className="row">
            <Link className="btn gray" href={`/print/agreement/${id}`} target="_blank">Agreement প্রিন্ট</Link>
            <button className="btn red" onClick={del}>🗑 শিডিউল মুছুন</button>
          </span>
        </div>
      )}
      {delivered && <div className="card" style={{ background: "#d1fae5" }}>✔ কাজটি ডেলিভারি হয়ে গেছে। দরকার হলে এখনো এডিট বা ডিলিট করতে পারবেন।</div>}

      <div className="card">
        <h3>কাজের ধরন</h3>
        <div className="row">
          <label style={{ margin: 0 }}><input type="radio" checked={!isEdit} onChange={() => setType("shoot")} /> আমাদের এখানে শুটিং (+ এডিট)</label>
          <label style={{ margin: 0 }}><input type="radio" checked={isEdit} onChange={() => setType("edit")} /> শুধু এডিট — ক্লায়েন্ট নিজে বা অন্য কোথাও শুট করে ফুটেজ এনেছে</label>
        </div>
      </div>

      <div className="card">
        <h3>ক্লায়েন্ট</h3>
        {!id && <label><input type="checkbox" checked={isNew} onChange={e => setIsNew(e.target.checked)} /> নতুন ক্লায়েন্ট</label>}
        {isNew && !id ? (
          <div className="grid">{field("নাম", "newName")}{field("ফোন নাম্বার", "newPhone")}</div>
        ) : (
          <ClientPicker clients={clients} value={f.clientId} onChange={cid => set("clientId", cid)} />
        )}
        <div style={{ marginTop: 10 }}>{field("ডেলিভারির জন্য অন্য নাম্বার (ঐচ্ছিক)", "deliveryPhone")}</div>
      </div>

      {cd?.client && !isNew && (
        <div className="card" style={{ background: "#eef2ff" }}>
          <h3>{cd.client.name} — আগের কাজ ও হিসাব {member && <span className="badge vip">Premium Member</span>}</h3>
          {member && (
            <>
              <p style={{ marginTop: 0 }}>প্যাকেজ: <b>{cd.client.pkg?.name || "-"}</b>{cd.client.pkg?.endDate && <> (মেয়াদ: {cd.client.pkg.startDate || "?"} → {cd.client.pkg.endDate})</>}</p>
              <div className="bar"><div style={{ width: (ps.allowed ? Math.min(100, (ps.used / ps.allowed) * 100) : 0) + "%" }} /></div>
              <p>ঘন্টা ({ps.periodText}): <b>{fmtDur(ps.used)}</b> / {cd.client.pkg?.monthlyHours || 0} ঘন্টা — বাকি: <b>{fmtDur(ps.left)}</b>
                {ps.over > 0 && <span style={{ color: "#dc2626" }}> (প্যাকেজের চেয়ে {fmtDur(ps.over)} বেশি)</span>}</p>
              {ps.credit > 0 && <p>টাকার ব্যালেন্স: খরচ <b>{ps.moneyUsed}</b> / {ps.credit} টাকা — বাকি: <b style={{ color: ps.moneyLeft < 0 ? "#dc2626" : undefined }}>{ps.moneyLeft}</b> টাকা</p>}
            </>
          )}
          {!id && prevJobs.some((j: any) => !["delivered", "rejected"].includes(j.status)) && <p><b>💡 এই ক্লায়েন্টের চলমান কাজ আছে।</b> একই কাজে নতুন দিনের সময় যোগ করতে চাইলে নতুন কাজ না খুলে নিচের তালিকা থেকে সেটি খুলে সেশন যোগ করুন।</p>}
          <table>
            <thead><tr><th>তারিখ</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মোট সময়</th><th></th></tr></thead>
            <tbody>
              {prevJobs.map((j: any) => (
                <tr key={j._id}><td>{j.date}</td><td>{j.jobType === "edit" && "✂ "}{j.serviceType}</td><td><span className={`badge ${j.status}`}>{statusLabel(j.status, j.jobType)}</span></td><td>{fmtDur(j.durationMinutes || 0)}</td>
                  <td><Link href={`/jobs/${j._id}`}>খুলুন</Link></td></tr>
              ))}
              {!prevJobs.length && <tr><td colSpan={5}>আগের কোনো কাজ নেই</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3>{isEdit ? "এডিটের কাজের তথ্য" : "কাজের তথ্য ও শিডিউল"}</h3>
        <div className="grid">
          <div>
            <label>সার্ভিস</label>
            <select className="input" value={services.includes(f.serviceType) && !f._other ? f.serviceType : "__other"}
              onChange={e => e.target.value === "__other" ? setF((p: any) => ({ ...p, _other: true, serviceType: "" })) : setF((p: any) => ({ ...p, _other: false, serviceType: e.target.value }))}>
              {services.map(s => <option key={s}>{s}</option>)}
              <option value="__other">অন্যান্য (নিজে লিখুন)</option>
            </select>
            {(!services.includes(f.serviceType) || f._other) && <input className="input" style={{ marginTop: 6 }} placeholder="সার্ভিসের নাম লিখুন" value={f.serviceType} onChange={e => set("serviceType", e.target.value)} />}
          </div>
          {field("শিরোনাম / বিবরণ", "title")}
          {isEdit ? (
            <>
              {field("ফুটেজ পাওয়ার তারিখ", "date", "date")}
              {field("এডিটর (কাকে দায়িত্ব)", "assignedTo")}
              <div><label>ফুটেজ কোথা থেকে</label>
                <select className="input" value={f.footageSource || "client_self"} onChange={e => set("footageSource", e.target.value)}>
                  {Object.entries(FOOTAGE_SOURCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
            </>
          ) : (
            <>
              {field("শুরুর তারিখ", "date", "date")}
              {field("শুরুর সময় (পরিকল্পিত)", "startTime", "time")}
              {field("শেষের সময় (পরিকল্পিত)", "endTime", "time")}
              {field("কাকে দায়িত্ব / সিডিউল", "assignedTo")}
              {field("লোকেশন", "location")}
            </>
          )}
        </div>
        {isEdit && (
          <>
            <label style={{ marginTop: 10 }}>কাঁচা ফুটেজের লিংক (Drive / অন্য কোথাও — প্রতি লাইনে একটি)</label>
            <textarea className="input" rows={2} value={f.flinks} onChange={e => set("flinks", e.target.value)} />
            <label style={{ marginTop: 10 }}>এডিটের নির্দেশনা (কী কী করতে হবে, কত মিনিটের ভিডিও, স্টাইল ইত্যাদি)</label>
            <textarea className="input" rows={3} value={f.footageNote || ""} onChange={e => set("footageNote", e.target.value)} />
          </>
        )}
        {!isEdit && planned != null && <p>পরিকল্পিত সময়: <b>{fmtDur(planned)}</b></p>}
      </div>

      <div className="card">
        <h3>চার্জ ও ডেলিভারি সময়</h3>
        <div className="grid">
          {field(f.usePackage && f.deductFrom === "money" ? "চার্জ (টাকা) — প্যাকেজের ব্যালেন্স থেকে কাটবে" : "মোট চার্জ (টাকা)", "charge", "number")}
          {!(f.usePackage && f.deductFrom === "money") && field("পেমেন্ট পেয়েছি (টাকা)", "paid", "number")}
          {field("ডেলিভারির সম্ভাব্য তারিখ", "expectedDeliveryDate", "date")}
          {field("ডেলিভারি সময় (যেমন: ৩ কার্যদিবস)", "deliveryEstimate")}
        </div>
        <label style={{ marginTop: 10 }}><input type="checkbox" checked={!!f.usePackage} onChange={e => set("usePackage", e.target.checked)} /> এই কাজ Member প্যাকেজ থেকে কাটবে (না টিক দিলে আলাদা / এক্সট্রা সার্ভিস হিসেবে চার্জ হবে)</label>
        {f.usePackage && (
          <div style={{ marginLeft: 22 }}>
            {cd?.client && !member && <p style={{ color: "#dc2626", margin: "4px 0" }}>⚠ এই ক্লায়েন্টের কোনো প্যাকেজ নেই। ক্লায়েন্ট ফাইলে গিয়ে প্যাকেজ দিন।</p>}
            <label style={{ fontWeight: 400 }}><input type="radio" checked={f.deductFrom !== "money"} onChange={() => set("deductFrom", "hours")} /> প্যাকেজের <b>ঘন্টা</b> থেকে কাটবে — {workWord} সেশনের মোট সময় কাটা হবে{member && <> (বাকি: {fmtDur(ps.left)})</>}</label>
            <label style={{ fontWeight: 400 }}><input type="radio" checked={f.deductFrom === "money"} onChange={() => set("deductFrom", "money")} /> প্যাকেজের <b>টাকা</b> থেকে কাটবে — উপরের চার্জ ব্যালেন্স থেকে কাটা হবে{member && <> (বাকি: {ps.moneyLeft} টাকা)</>}</label>
            {member && f.deductFrom === "money" && (f.charge || 0) > ps.moneyLeft + (id && cd?.moneyJobs?.some((j: any) => j._id === id) ? cd.moneyJobs.find((j: any) => j._id === id).charge || 0 : 0) &&
              <p style={{ color: "#dc2626", margin: "4px 0" }}>⚠ চার্জ প্যাকেজের বাকি ব্যালেন্সের চেয়ে বেশি — বাড়তি অংশ আলাদা নিতে হবে।</p>}
          </div>
        )}
      </div>

      <div className="card">
        <h3>{workWord} সেশন (আসল সময়) — মোট: {fmtDur(total)}</h3>
        {!id ? <p>কাজটি সেভ করার পর এখানে প্রতিদিনের আসল {workWord} সময় যোগ করতে পারবেন।</p> : (
          <>
            <p style={{ marginTop: 0 }}>{isEdit ? "এডিটর যতবার কাজ করবে, সময় যোগ করুন — শুরু/শেষ সময় অথবা সরাসরি কত ঘন্টা/মিনিট লাগল দিতে পারবেন" : "একই কাজে একাধিক দিনে শুট হলে প্রতিবার নতুন সেশন যোগ করুন — সব সময় নিজে থেকে যোগ হবে"}{f.usePackage && f.deductFrom !== "money" ? " এবং Member প্যাকেজের ঘন্টা থেকে কাটবে।" : "।"}</p>
            <table>
              <thead><tr><th>তারিখ</th><th>শুরু</th><th>শেষ</th><th>সময়</th><th>নোট</th><th></th></tr></thead>
              <tbody>
                {(f.sessions || []).map((s: any) => (
                  <tr key={s._id}><td>{s.date}</td><td>{s.start ? fmt12(s.start) : "-"}</td><td>{s.end ? fmt12(s.end) : "-"}</td><td>{fmtDur(s.minutes)}</td><td>{s.note}</td>
                    <td><a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); delSession(s._id); }}>মুছুন</a></td></tr>
                ))}
                {!(f.sessions || []).length && <tr><td colSpan={6}>এখনো কোনো সেশন নেই</td></tr>}
              </tbody>
            </table>
            <div className="grid" style={{ marginTop: 12 }}>
              <div><label>তারিখ</label><input type="date" className="input" value={ss.date} onChange={e => setSs({ ...ss, date: e.target.value })} /></div>
              <div><label>শুরু</label><input type="time" className="input" value={ss.start} onChange={e => setSs({ ...ss, start: e.target.value })} /></div>
              <div><label>শেষ</label><input type="time" className="input" value={ss.end} onChange={e => setSs({ ...ss, end: e.target.value })} /></div>
              {isEdit && <div><label>অথবা মোট সময় (ঘন্টা / মিনিট)</label><div className="row" style={{ flexWrap: "nowrap" }}>
                <input type="number" min={0} className="input" placeholder="ঘন্টা" value={ss.h} onChange={e => setSs({ ...ss, h: e.target.value })} />
                <input type="number" min={0} className="input" placeholder="মিনিট" value={ss.m} onChange={e => setSs({ ...ss, m: e.target.value })} /></div></div>}
              <div><label>নোট (ঐচ্ছিক)</label><input className="input" value={ss.note} onChange={e => setSs({ ...ss, note: e.target.value })} /></div>
            </div>
            <div className="row" style={{ marginTop: 8 }}><button type="button" className="btn" onClick={addSession}>+ সেশন যোগ করুন</button>{sessionPreview != null && <span>এই সেশন: <b>{fmtDur(sessionPreview)}</b></span>}</div>
          </>
        )}
      </div>

      <div className="card">
        <h3>ডেলিভারি নোট</h3>
        <label>Google Drive লিংক (প্রতি লাইনে একটি)</label>
        <textarea className="input" rows={3} value={f.links} onChange={e => set("links", e.target.value)} />
        <label style={{ marginTop: 10 }}>ডেলিভারি নোট</label>
        <textarea className="input" rows={2} value={f.deliveryNote} onChange={e => set("deliveryNote", e.target.value)} />
        <label style={{ marginTop: 10 }}>অতিরিক্ত নোট (ঐচ্ছিক)</label>
        <textarea className="input" rows={2} value={f.optionalNote} onChange={e => set("optionalNote", e.target.value)} />
      </div>

      <div className="row"><button className="btn" onClick={() => send()}>{id ? "সেভ করুন" : "কাজ যোগ করুন"}</button><span>{msg}</span></div>
    </>
  );
}
