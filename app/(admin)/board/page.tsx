"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt12, fmtDur, tk, statusLabel, waLink } from "@/lib/utils";

const COLS = [
  { s: "pending", t: "🕓 Approval বাকি", next: "approve", btn: "Approve" },
  { s: "approved", t: "🎬 কাজ চলছে", next: "complete", btn: "সম্পন্ন" },
  { s: "completed", t: "📦 ডেলিভারি বাকি", next: "deliver", btn: "ডেলিভারি" },
  { s: "delivered", t: "✅ ডেলিভারি হয়েছে", next: "", btn: "" },
];

// স্ট্যাটাস অনুযায়ী কাজের বোর্ড — এক নজরে কোন কাজ কোথায়
export default function Board() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [qs, setQs] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => fetch(`/api/jobs${type ? `?jobType=${type}` : ""}`).then(r => r.json()).then(setJobs);
  useEffect(() => { load(); }, [type]);
  async function move(j: any, action: string) {
    setMsg("");
    const r = await fetch(`/api/jobs/${j._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (!r.ok) setMsg(`❌ ${j.serviceType}: ${(await r.json()).error}`); else load();
  }
  const today = new Date().toLocaleDateString("en-CA");
  const s = qs.trim().toLowerCase();
  const shown = jobs.filter(j => !s || [j.client?.name, j.client?.phone, j.serviceType, j.title, j.assignedTo].some(x => (x || "").toLowerCase().includes(s)));
  const recentCut = new Date(Date.now() - 30 * 864e5).toLocaleDateString("en-CA");

  return (
    <>
      <div className="card row">
        <h3 style={{ margin: 0 }}>কাজের বোর্ড</h3>
        <input className="input" style={{ maxWidth: 260 }} placeholder="🔍 ক্লায়েন্ট / ফোন / সার্ভিস / দায়িত্ব" value={qs} onChange={e => setQs(e.target.value)} />
        <select className="input" style={{ maxWidth: 160 }} value={type} onChange={e => setType(e.target.value)}><option value="">সব কাজ</option><option value="shoot">শুটিং</option><option value="edit">শুধু এডিট</option></select>
        <span>{msg}</span>
        <Link className="btn" style={{ marginLeft: "auto" }} href="/jobs/new">+ নতুন কাজ</Link>
      </div>
      <div className="board">
        {COLS.map(c => {
          let list = shown.filter(j => j.status === c.s);
          if (c.s === "delivered") list = list.filter(j => (j.deliveredAt || j.date || "").slice(0, 10) >= recentCut);
          list.sort((a, b) => c.s === "delivered" ? 0 : (a.date || "").localeCompare(b.date || ""));
          return (
            <div className="col" key={c.s}>
              <h4><span>{c.t}</span><span className="badge">{list.length}</span></h4>
              {c.s === "delivered" && <small>শেষ ৩০ দিন</small>}
              {list.map(j => {
                const due = j.usePackage && j.deductFrom === "money" ? 0 : (j.charge || 0) - (j.paid || 0);
                const late = c.s !== "delivered" && ((c.s === "completed" && j.expectedDeliveryDate && j.expectedDeliveryDate < today) || (c.s !== "completed" && j.jobType !== "edit" && j.date < today));
                return (
                  <div className="kcard" key={j._id} style={late ? { borderLeft: "4px solid #dc2626" } : undefined}>
                    <Link href={`/jobs/${j._id}`}><b>{j.jobType === "edit" && "✂ "}{j.serviceType}</b></Link>{j.packageName && <span className="badge vip" style={{ marginLeft: 4 }}>📦</span>}
                    <div>{j.client?.name} {j.client?.isMember && "⭐"}</div>
                    <div style={{ color: "#6b7280" }}>{j.date}{j.jobType !== "edit" && j.startTime && ` • ${fmt12(j.startTime)}`}{j.assignedTo && ` • ${j.assignedTo}`}</div>
                    {j.durationMinutes > 0 && <div>⏱ {fmtDur(j.durationMinutes)}</div>}
                    {c.s === "completed" && j.expectedDeliveryDate && <div style={{ color: late ? "#dc2626" : undefined }}>ডেলিভারি: {j.expectedDeliveryDate}</div>}
                    {due > 0 && <div style={{ color: "#dc2626" }}>বকেয়া {tk(due)}</div>}
                    {late && <div style={{ color: "#dc2626" }}>⚠ সময় পেরিয়ে গেছে</div>}
                    <div className="row" style={{ marginTop: 6 }}>
                      {c.next && <button className="btn green" onClick={() => move(j, c.next)}>{c.btn} →</button>}
                      {c.s === "pending" && <button className="btn red" onClick={() => confirm("Reject করবেন?") && move(j, "reject")}>✕</button>}
                      {due > 0 && <Link className="btn gray" href={`/payments?tab=dues`}>৳</Link>}
                      {c.s === "delivered" && j.client?.phone && <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(j.deliveryPhone || j.client.phone, `আসসালামু আলাইকুম ${j.client.name}, আপনার "${j.serviceType}" কাজটি ডেলিভারি দেওয়া হয়েছে:\n${(j.driveLinks || []).join("\n")}\nধন্যবাদ — আমিও উদ্যোক্তা`)}>WhatsApp</a>}
                    </div>
                    <small style={{ color: "#9ca3af" }}>{statusLabel(j.status, j.jobType)}</small>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
