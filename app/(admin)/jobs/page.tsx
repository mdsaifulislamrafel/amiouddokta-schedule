"use client";
import { useEffect, useState } from "react";
import JobTable from "@/components/JobTable";
import { SERVICES, EDIT_SERVICES, STATUS_LABEL, JOB_TYPE_LABEL, statusLabel, fmt12 } from "@/lib/utils";

const esc = (v: any) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [f, setF] = useState({ jobType: "", status: "", serviceType: "", from: "", to: "" });
  const load = () => {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as any).toString();
    fetch("/api/jobs?" + q).then(r => r.json()).then(setJobs);
  };
  useEffect(() => { load(); }, [f]);
  async function onDelete(id: string) {
    if (!confirm("এই শিডিউলটি মুছে ফেলবেন?")) return;
    const r = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!r.ok) alert((await r.json()).error);
    load();
  }
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  // ফিল্টার করা লিস্ট প্রিন্ট (নতুন উইন্ডোতে খুলে প্রিন্ট ডায়ালগ আসবে)
  function printList() {
    if (!jobs.length) return alert("প্রিন্ট করার মতো কোনো কাজ নেই");
    // প্রিন্টে তারিখ ও সময় অনুযায়ী পুরনো থেকে নতুন সাজানো
    const sorted = [...jobs].sort((a, b) => ((a.date || "") + (a.startTime || "")).localeCompare((b.date || "") + (b.startTime || "")));

    const filters = [
      f.jobType && `ধরন: ${JOB_TYPE_LABEL[f.jobType]}`,
      f.status && `স্ট্যাটাস: ${(STATUS_LABEL as any)[f.status] || f.status}`,
      f.serviceType && `সার্ভিস: ${f.serviceType}`,
      f.from && `থেকে: ${f.from}`,
      f.to && `পর্যন্ত: ${f.to}`,
    ].filter(Boolean).join(" | ") || "সব কাজ";

    const rows = sorted.map((j, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(j.client?.name || "-")}</td>
        <td>${esc(j.client?.phone || "-")}</td>
        <td>${j.jobType === "edit" ? "[শুধু এডিট] " : ""}${esc(j.serviceType)}${j.title ? `<br><small>${esc(j.title)}</small>` : ""}</td>
        <td>${esc(j.date)}<br>${j.startTime && j.endTime ? esc(fmt12(j.startTime)) + " - " + esc(fmt12(j.endTime)) : "-"}</td>
        <td>${esc(statusLabel(j.status, j.jobType))}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>কাজের শিডিউল লিস্ট</title>
      <style>
        body { font-family: "Segoe UI", "Noto Sans Bengali", Arial, sans-serif; margin: 20px; color: #111; }
        h2 { margin: 0 0 4px; }
        .meta { font-size: 13px; color: #444; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        small { color: #555; }
        @media print { body { margin: 8mm; } }
      </style></head><body>
      <h2>কাজের শিডিউল লিস্ট</h2>
      <div class="meta">ফিল্টার: ${esc(filters)}<br>মোট কাজ: ${sorted.length} | প্রিন্টের তারিখ: ${esc(new Date().toLocaleDateString("en-CA"))}</div>
      <table>
        <thead><tr><th>#</th><th>ক্লায়েন্টের নাম</th><th>ফোন নাম্বার</th><th>কাজ</th><th>তারিখ ও সময়</th><th>স্ট্যাটাস</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`;

    const w = window.open("", "_blank");
    if (!w) return alert("পপ-আপ ব্লক হয়েছে। ব্রাউজারে এই সাইটের জন্য পপ-আপ Allow করুন।");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="card">
      <div className="grid" style={{ marginBottom: 12 }}>
        <div><label>কাজের ধরন</label><select className="input" value={f.jobType} onChange={e => set("jobType", e.target.value)}><option value="">সব</option>{Object.entries(JOB_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label>স্ট্যাটাস</label><select className="input" value={f.status} onChange={e => set("status", e.target.value)}><option value="">সব</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
        <div><label>সার্ভিস</label><input className="input" list="svc" placeholder="সব" value={f.serviceType} onChange={e => set("serviceType", e.target.value)} /><datalist id="svc">{[...SERVICES, ...EDIT_SERVICES].map(s => <option key={s} value={s} />)}</datalist></div>
        <div><label>থেকে</label><input type="date" className="input" value={f.from} onChange={e => set("from", e.target.value)} /></div>
        <div><label>পর্যন্ত</label><input type="date" className="input" value={f.to} onChange={e => set("to", e.target.value)} /></div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn" onClick={printList}>🖨 লিস্ট প্রিন্ট করুন</button>
        <span>মোট: <b>{jobs.length}</b> টি কাজ</span>
      </div>
      <JobTable jobs={jobs} onDelete={onDelete} />
    </div>
  );
}