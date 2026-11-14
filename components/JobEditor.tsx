"use client";
import { useEffect, useState } from "react";
import ClientPicker from "@/components/ClientPicker";
import ReceivePayment, { PaymentList } from "@/components/ReceivePayment";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SERVICES, EDIT_SERVICES, FOOTAGE_SOURCE, calcMinutes, fmtDur, fmt12, statusLabel, pkgSummary, tk, waLink, PAY_METHODS } from "@/lib/utils";

const empty: any = { jobType: "shoot", footageSource: "client_self", flinks: "", footageNote: "", deductFrom: "hours", clientId: "", newName: "", newPhone: "", deliveryPhone: "", serviceType: SERVICES[0], title: "", date: "", startTime: "", endTime: "", assignedTo: "", location: "Office", charge: 0, paid: 0, usePackage: false, expectedDeliveryDate: "", deliveryEstimate: "", links: "", deliveryNote: "", optionalNote: "", status: "pending", sessions: [] };

export default function JobEditor({ id }: { id?: string }) {
  const router = useRouter();
  const today = new Date().toLocaleDateString("en-CA");
  const [f, setF] = useState<any>(empty);
  const [clients, setClients] = useState<any[]>([]);
  const [cd, setCd] = useState<any>(null); // নির্বাচিত ক্লায়েন্টের আগের ডেটা
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [pkgs, setPkgs] = useState<any[]>([]);
  const [payKey, setPayKey] = useState(0);
  const [collectors, setCollectors] = useState<any[]>([]);
  useEffect(() => { fetch("/api/collectors?active=1").then(r => r.json()).then(d => Array.isArray(d) && setCollectors(d)); }, []);
  const [ss, setSs] = useState({ date: today, start: "", end: "", h: "", m: "", note: "" });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const load = (j: any) => setF({ ...empty, ...j, jobType: j.jobType || "shoot", deductFrom: j.deductFrom || "hours", clientId: j.client?._id || "", links: (j.driveLinks || []).join("\n"), flinks: (j.footageLinks || []).join("\n") });
  const loadClient = (cid: string) => fetch(`/api/clients/${cid}`).then(r => r.json()).then(x => setCd(x.client ? x : null));

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(setClients);
    fetch("/api/packages?active=1").then(r => r.json()).then(d => Array.isArray(d) && setPkgs(d));
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
  const selPkgId: string = f.assignPackageId || (f.packageId?._id ?? f.packageId) || "";
  // সার্ভিস বা প্যাকেজ বাছাই — সার্ভিসের লিস্ট আগের মতোই, পাশাপাশি প্যাকেজ
  function pickService(v: string) {
    if (v.startsWith("pkg:")) {
      const t = pkgs.find(p => p._id === v.slice(4));
      if (!t) return;
      return setF((p: any) => ({ ...p, _other: false, assignPackageId: t._id, packageName: t.name, usePackage: true, deductFrom: "hours", serviceType: t.serviceType || t.name }));
    }
    const base = { assignPackageId: "", packageId: null, packageName: "" };
    if (v === "__other") setF((p: any) => ({ ...p, ...base, _other: true, serviceType: "" }));
    else setF((p: any) => ({ ...p, ...base, _other: false, serviceType: v }));
  }
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
            <select className="input" value={selPkgId ? `pkg:${selPkgId}` : services.includes(f.serviceType) && !f._other ? f.serviceType : "__other"} onChange={e => pickService(e.target.value)}>
              <optgroup label={isEdit ? "এডিট সার্ভিস" : "সার্ভিস"}>
                {services.map(s => <option key={s}>{s}</option>)}
                <option value="__other">অন্যান্য (নিজে লিখুন)</option>
              </optgroup>
              {pkgs.length > 0 && <optgroup label="📦 প্যাকেজ (ক্লায়েন্ট প্যাকেজে যেতে চাইলে)">
                {pkgs.map(p => <option key={p._id} value={`pkg:${p._id}`}>📦 {p.name} — {tk(p.price)}</option>)}
              </optgroup>}
              {selPkgId && !pkgs.some(p => p._id === selPkgId) && <option value={`pkg:${selPkgId}`}>📦 {f.packageName}</option>}
            </select>
            {!selPkgId && (!services.includes(f.serviceType) || f._other) && <input className="input" style={{ marginTop: 6 }} placeholder="সার্ভিসের নাম লিখুন" value={f.serviceType} onChange={e => set("serviceType", e.target.value)} />}
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
        {selPkgId && (() => {
          const t = pkgs.find(p => p._id === selPkgId);
          const already = cd?.client?.isMember && String(cd.client.pkg?.packageId || "") === selPkgId;
          return (
            <div className="pkg-box">
              <b>📦 প্যাকেজ: {t?.name || f.packageName}</b>
              {t && <> — মূল্য {tk(t.price)} | {t.hours ? `${t.hours} ঘন্টা ${t.hoursPeriod === "total" ? "(পুরো মেয়াদে)" : "প্রতি মাসে"}` : "ঘন্টা নেই"}{t.credit ? ` | টাকার ব্যালেন্স ${tk(t.credit)}` : ""} | মেয়াদ {t.durationMonths || 1} মাস</>}
              {t?.features?.length > 0 && <ul style={{ margin: "6px 0" }}>{t.features.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>}
              <div style={{ fontSize: 13 }}>
                {f.assignPackageId
                  ? already ? "✔ ক্লায়েন্টের এই প্যাকেজ আগে থেকেই চালু আছে — এই কাজ সেই প্যাকেজ থেকে কাটবে।"
                    : cd?.client?.isMember ? `⚠ সেভ করলে ক্লায়েন্টের বর্তমান প্যাকেজ (${cd.client.pkg?.name}) বদলে এই প্যাকেজ চালু হবে, আগের কাজের হিসাব থাকবে।`
                    : "সেভ করলে ক্লায়েন্টকে এই প্যাকেজ দেওয়া হবে (মেয়াদ কাজের তারিখ থেকে) — এরপর ঘন্টা/টাকার হিসাব ক্লায়েন্ট ফাইলে চলবে।"
                  : "এই কাজটি এই প্যাকেজের আওতায় নেওয়া হয়েছে।"}
                {!id && " এখানে দেওয়া অগ্রিম টাকা প্যাকেজের মূল্যে জমা হবে।"}
              </div>
              {cd?.client?._id && <Link href={`/print/package/${cd.client._id}`} target="_blank">প্যাকেজ Agreement দেখুন →</Link>}
            </div>
          );
        })()}
      </div>

      <div className="card">
        <h3>চার্জ ও ডেলিভারি সময়</h3>
        <div className="grid">
          {field(f.usePackage && f.deductFrom === "money" ? "চার্জ (টাকা) — প্যাকেজের ব্যালেন্স থেকে কাটবে" : "মোট চার্জ (টাকা)", "charge", "number")}
          {!(f.usePackage && f.deductFrom === "money") && (id
            ? <div><label>জমা হয়েছে / বকেয়া</label><div className="input" style={{ background: "#f3f4f6" }}>{tk(f.paid)} জমা | <b style={{ color: (f.charge || 0) - (f.paid || 0) > 0 ? "#dc2626" : "#059669" }}>{tk((f.charge || 0) - (f.paid || 0))} বকেয়া</b></div></div>
            : <>{field(selPkgId ? "অগ্রিম পেয়েছি (প্যাকেজের মূল্যে জমা হবে)" : "অগ্রিম পেয়েছি (টাকা)", "paid", "number")}
                {(f.paid || 0) > 0 && <div><label>কিভাবে পেয়েছেন</label><select className="input" value={f.payMethod || "Cash"} onChange={e => set("payMethod", e.target.value)}>{PAY_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>}
                {(f.paid || 0) > 0 && collectors.length > 0 && <div><label>কার কাছে জমা দিয়েছে</label><select className="input" value={f.payCollector || ""} onChange={e => set("payCollector", e.target.value)}><option value="">সরাসরি অফিসে</option>{collectors.map(c => <option key={c._id} value={c._id}>{c.name} ({c.designation})</option>)}</select></div>}</>)}
          {field("ডেলিভারির সম্ভাব্য তারিখ", "expectedDeliveryDate", "date")}
          {field("ডেলিভারি সময় (যেমন: ৩ কার্যদিবস)", "deliveryEstimate")}
        </div>
        <label style={{ marginTop: 10 }}><input type="checkbox" checked={!!f.usePackage} onChange={e => set("usePackage", e.target.checked)} /> এই কাজ Member প্যাকেজ থেকে কাটবে (না টিক দিলে আলাদা / এক্সট্রা সার্ভিস হিসেবে চার্জ হবে)</label>
        {f.usePackage && (
          <div style={{ marginLeft: 22 }}>
            {cd?.client && !member && <p style={{ color: "#dc2626", margin: "4px 0" }}>⚠ এই ক্লায়েন্টের কোনো প্যাকেজ নেই। উপরের সার্ভিস থেকে একটি 📦 প্যাকেজ বাছাই করুন অথবা ক্লায়েন্ট ফাইলে গিয়ে প্যাকেজ দিন।</p>}
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

      {id && f.clientId && (
        <div className="card">
          <h3>💰 টাকা জমা ও রশিদ</h3>
          <ReceivePayment clientId={f.clientId} jobId={id} kind={selPkgId && !(f.charge > 0) ? "package" : "job"}
            onDone={() => { setPayKey(k => k + 1); fetch(`/api/jobs/${id}`).then(r => r.json()).then(j => setF((p: any) => ({ ...p, paid: j.paid }))); loadClient(f.clientId); }} />
          <h4 style={{ marginBottom: 4 }}>এই ক্লায়েন্টের জমার ইতিহাস</h4>
          <PaymentList query={`clientId=${f.clientId}`} reloadKey={payKey} onChange={() => fetch(`/api/jobs/${id}`).then(r => r.json()).then(j => setF((p: any) => ({ ...p, paid: j.paid })))} />
        </div>
      )}

      <div className="card">
        <h3>ডেলিভারি নোট</h3>
        <label>Google Drive লিংক (প্রতি লাইনে একটি)</label>
        <textarea className="input" rows={3} value={f.links} onChange={e => set("links", e.target.value)} />
        <label style={{ marginTop: 10 }}>ডেলিভারি নোট</label>
        <textarea className="input" rows={2} value={f.deliveryNote} onChange={e => set("deliveryNote", e.target.value)} />
        <label style={{ marginTop: 10 }}>অতিরিক্ত নোট (ঐচ্ছিক)</label>
        <textarea className="input" rows={2} value={f.optionalNote} onChange={e => set("optionalNote", e.target.value)} />
        {id && f.links?.trim() && (f.deliveryPhone || cd?.client?.phone) && (
          <a className="btn wa" style={{ marginTop: 10 }} target="_blank" rel="noreferrer" href={waLink(f.deliveryPhone || cd?.client?.phone,
            `আসসালামু আলাইকুম ${cd?.client?.name || ""},\nআপনার "${f.serviceType}${f.title ? " — " + f.title : ""}" কাজটি ডেলিভারি দেওয়া হলো:\n${f.links.trim()}${f.deliveryNote ? "\n" + f.deliveryNote : ""}${(f.charge || 0) - (f.paid || 0) > 0 && !(f.usePackage && f.deductFrom === "money") ? `\nবকেয়া: ${tk((f.charge || 0) - (f.paid || 0))}` : ""}\nধন্যবাদ — আমিও উদ্যোক্তা`)}>📲 WhatsApp এ ডেলিভারি লিংক পাঠান</a>
        )}
      </div>

      <div className="row"><button className="btn" onClick={() => send()}>{id ? "সেভ করুন" : "কাজ যোগ করুন"}</button><span>{msg}</span></div>
    </>
  );
}
