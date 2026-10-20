"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SERVICES, calcMinutes, fmtDur, fmt12, STATUS_LABEL } from "@/lib/utils";

const empty: any = { clientId: "", newName: "", newPhone: "", deliveryPhone: "", serviceType: SERVICES[0], title: "", date: "", startTime: "", endTime: "", assignedTo: "", location: "Office", charge: 0, paid: 0, usePackage: false, expectedDeliveryDate: "", deliveryEstimate: "", links: "", deliveryNote: "", optionalNote: "", status: "pending", sessions: [] };

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
  const [ss, setSs] = useState({ date: today, start: "", end: "", note: "" });
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const load = (j: any) => setF({ ...empty, ...j, clientId: j.client?._id || "", links: (j.driveLinks || []).join("\n") });
  const loadClient = (cid: string) => fetch(`/api/clients/${cid}`).then(r => r.json()).then(x => setCd(x.client ? x : null));

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(setClients);
    if (id) fetch(`/api/jobs/${id}`).then(r => r.json()).then(load);
    else { const c = new URLSearchParams(location.search).get("clientId"); if (c) set("clientId", c); }
  }, [id]);
  // ক্লায়েন্ট সিলেক্ট করলেই আগের কাজ/হিসাব অটো আসবে
  useEffect(() => { if (f.clientId && !isNew) loadClient(f.clientId); else setCd(null); }, [f.clientId, isNew]);

  async function send(action?: string) {
    setMsg("");
    const body: any = { ...f, action, driveLinks: f.links.split("\n").map((s: string) => s.trim()).filter(Boolean) };
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
    if (!confirm("এই কাজটি মুছে ফেলবেন?")) return;
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
    await afterSession(await fetch(`/api/jobs/${id}/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ss) }));
    setSs(p => ({ ...p, start: "", end: "", note: "" }));
  };
  const delSession = async (sid: string) => { if (confirm("এই সেশন মুছবেন?")) await afterSession(await fetch(`/api/jobs/${id}/sessions?sid=${sid}`, { method: "DELETE" })); };

  const locked = !!id && f.status === "delivered";
  const planned = calcMinutes(f.startTime, f.endTime);
  const total = (f.sessions || []).reduce((a: number, s: any) => a + (s.minutes || 0), 0);
  const sessionPreview = calcMinutes(ss.start, ss.end);
  const field = (label: string, k: string, type = "text") => (<div><label>{label}</label><input className="input" type={type} value={f[k] ?? ""} onChange={e => set(k, type === "number" ? Number(e.target.value) : e.target.value)} /></div>);

  const month = today.slice(0, 7);
  const allowed = (cd?.client?.pkg?.monthlyHours || 0) * 60;
  const used = cd?.usage?.[month] || 0;
  const prevJobs = (cd?.jobs || []).filter((j: any) => j._id !== id);

  return (
    <>
      {id && (
        <div className="card row">
          <span className={`badge ${f.status}`}>{STATUS_LABEL[f.status]}</span>
          {f.status === "pending" && <><button className="btn green" onClick={() => send("approve")}>✔ কাজটি অফিসে করার Approve</button><button className="btn red" onClick={() => send("reject")}>Reject</button></>}
          {f.status === "approved" && <button className="btn green" onClick={() => send("complete")}>✔ কাজ সম্পন্ন (সব শুট শেষ)</button>}
          {f.status === "completed" && <button className="btn green" onClick={() => send("deliver")}>✔ ডেলিভারি Approve (Drive লিংক লাগবে)</button>}
          <span style={{ marginLeft: "auto" }} className="row">
            <Link className="btn gray" href={`/print/agreement/${id}`} target="_blank">Agreement প্রিন্ট</Link>
            {!locked ? <button className="btn red" onClick={del}>🗑 শিডিউল মুছুন</button> : <span className="badge">ডেলিভারি হয়ে গেছে — মোছা যাবে না</span>}
          </span>
        </div>
      )}
      {locked && <div className="card" style={{ background: "#d1fae5" }}>✔ কাজটি ডেলিভারি হয়ে গেছে — এখন আর এডিট বা ডিলিট করা যাবে না। শুধু Agreement প্রিন্ট করা যাবে।</div>}

      <fieldset disabled={locked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
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
            <h3>{cd.client.name} — আগের কাজ ও হিসাব {cd.client.isMember && <span className="badge vip">Premium Member</span>}</h3>
            {cd.client.isMember && (
              <>
                <div className="bar"><div style={{ width: (allowed ? Math.min(100, (used / allowed) * 100) : 0) + "%" }} /></div>
                <p>এই মাসে ({month}) ব্যবহার: <b>{fmtDur(used)}</b> / {cd.client.pkg?.monthlyHours || 0} ঘন্টা — বাকি: <b>{fmtDur(Math.max(0, allowed - used))}</b>
                  {allowed > 0 && used > allowed && <span style={{ color: "#dc2626" }}> (প্যাকেজের চেয়ে {fmtDur(used - allowed)} বেশি)</span>}</p>
              </>
            )}
            {!id && prevJobs.some((j: any) => !["delivered", "rejected"].includes(j.status)) && <p><b>💡 এই ক্লায়েন্টের চলমান কাজ আছে।</b> একই কাজে নতুন দিনের সময় যোগ করতে চাইলে নতুন কাজ না খুলে নিচের তালিকা থেকে সেটি খুলে "শুটিং সেশন" এ যোগ করুন।</p>}
            <table>
              <thead><tr><th>তারিখ</th><th>সার্ভিস</th><th>স্ট্যাটাস</th><th>মোট সময়</th><th></th></tr></thead>
              <tbody>
                {prevJobs.map((j: any) => (
                  <tr key={j._id}><td>{j.date}</td><td>{j.serviceType}</td><td><span className={`badge ${j.status}`}>{STATUS_LABEL[j.status]}</span></td><td>{fmtDur(j.durationMinutes || 0)}</td>
                    <td><Link href={`/jobs/${j._id}`}>{["delivered", "rejected"].includes(j.status) ? "দেখুন" : "খুলুন / সেশন যোগ"}</Link></td></tr>
                ))}
                {!prevJobs.length && <tr><td colSpan={5}>আগের কোনো কাজ নেই</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <div className="card">
          <h3>কাজের তথ্য ও শিডিউল</h3>
          <div className="grid">
            <div>
              <label>সার্ভিস</label>
              <select className="input" value={SERVICES.includes(f.serviceType) && !f._other ? f.serviceType : "__other"}
                onChange={e => e.target.value === "__other" ? setF((p: any) => ({ ...p, _other: true, serviceType: "" })) : setF((p: any) => ({ ...p, _other: false, serviceType: e.target.value }))}>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
                <option value="__other">অন্যান্য (নিজে লিখুন)</option>
              </select>
              {(!SERVICES.includes(f.serviceType) || f._other) && <input className="input" style={{ marginTop: 6 }} placeholder="সার্ভিসের নাম লিখুন" value={f.serviceType} onChange={e => set("serviceType", e.target.value)} />}
            </div>
            {field("শিরোনাম / বিবরণ", "title")}
            {field("শুরুর তারিখ", "date", "date")}
            {field("শুরুর সময় (পরিকল্পিত)", "startTime", "time")}
            {field("শেষের সময় (পরিকল্পিত)", "endTime", "time")}
            {field("কাকে দায়িত্ব / সিডিউল", "assignedTo")}
            {field("লোকেশন", "location")}
          </div>
          {planned != null && <p>পরিকল্পিত সময়: <b>{fmtDur(planned)}</b></p>}
        </div>

        <div className="card">
          <h3>চার্জ ও ডেলিভারি সময়</h3>
          <div className="grid">
            {field("মোট চার্জ (টাকা)", "charge", "number")}
            {field("পেমেন্ট পেয়েছি (টাকা)", "paid", "number")}
            {field("ডেলিভারির সম্ভাব্য তারিখ", "expectedDeliveryDate", "date")}
            {field("ডেলিভারি সময় (যেমন: ৩ কার্যদিবস)", "deliveryEstimate")}
          </div>
          <label style={{ marginTop: 10 }}><input type="checkbox" checked={!!f.usePackage} onChange={e => set("usePackage", e.target.checked)} /> এই কাজের সেশনগুলো Member প্যাকেজের ঘন্টা থেকে কাটবে (না টিক দিলে এক্সট্রা সার্ভিস হিসেবে চার্জ হবে)</label>
        </div>

        <div className="card">
          <h3>শুটিং সেশন (আসল সময়) — মোট: {fmtDur(total)}</h3>
          {!id ? <p>কাজটি সেভ করার পর এখানে প্রতিদিনের আসল শুটিং সময় যোগ করতে পারবেন।</p> : (
            <>
              <p style={{ marginTop: 0 }}>একই কাজে একাধিক দিনে শুট হলে প্রতিবার নতুন সেশন যোগ করুন — সব সময় নিজে থেকে যোগ হবে{f.usePackage ? " এবং Member প্যাকেজের হিসাবেও যাবে।" : "।"}</p>
              <table>
                <thead><tr><th>তারিখ</th><th>শুরু</th><th>শেষ</th><th>সময়</th><th>নোট</th><th></th></tr></thead>
                <tbody>
                  {(f.sessions || []).map((s: any) => (
                    <tr key={s._id}><td>{s.date}</td><td>{fmt12(s.start)}</td><td>{fmt12(s.end)}</td><td>{fmtDur(s.minutes)}</td><td>{s.note}</td>
                      <td><a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); delSession(s._id); }}>মুছুন</a></td></tr>
                  ))}
                  {!(f.sessions || []).length && <tr><td colSpan={6}>এখনো কোনো সেশন নেই</td></tr>}
                </tbody>
              </table>
              <div className="grid" style={{ marginTop: 12 }}>
                <div><label>তারিখ</label><input type="date" className="input" value={ss.date} onChange={e => setSs({ ...ss, date: e.target.value })} /></div>
                <div><label>শুরু</label><input type="time" className="input" value={ss.start} onChange={e => setSs({ ...ss, start: e.target.value })} /></div>
                <div><label>শেষ</label><input type="time" className="input" value={ss.end} onChange={e => setSs({ ...ss, end: e.target.value })} /></div>
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
      </fieldset>

      {!locked && <div className="row"><button className="btn" onClick={() => send()}>{id ? "সেভ করুন" : "কাজ যোগ করুন"}</button><span>{msg}</span></div>}
      {locked && msg && <p>{msg}</p>}
    </>
  );
}