"use client";
import { useEffect, useState } from "react";
import JobTable from "@/components/JobTable";
import { SERVICES, STATUS_LABEL } from "@/lib/utils";
export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [f, setF] = useState({ status: "", serviceType: "", from: "", to: "" });
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
  return (
    <div className="card">
      <div className="grid" style={{ marginBottom: 12 }}>
        <div><label>স্ট্যাটাস</label><select className="input" value={f.status} onChange={e => set("status", e.target.value)}><option value="">সব</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label>সার্ভিস</label><input className="input" list="svc" placeholder="সব" value={f.serviceType} onChange={e => set("serviceType", e.target.value)} /><datalist id="svc">{SERVICES.map(s => <option key={s} value={s} />)}</datalist></div>
        <div><label>থেকে</label><input type="date" className="input" value={f.from} onChange={e => set("from", e.target.value)} /></div>
        <div><label>পর্যন্ত</label><input type="date" className="input" value={f.to} onChange={e => set("to", e.target.value)} /></div>
      </div>
      <JobTable jobs={jobs} onDelete={onDelete} />
    </div>
  );
}
