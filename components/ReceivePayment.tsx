"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ClientPicker from "@/components/ClientPicker";
import { PAY_METHODS, tk, receiptNo, waLink } from "@/lib/utils";
import { receiptUrl } from "@/components/ReceiptView";

const METHOD_ICON: Record<string, string> = { Cash: "💵", bKash: "📱", Nagad: "📱", Rocket: "📱", Bank: "🏦", Card: "💳" };

// WhatsApp মেসেজ — ছোট লেখা + অনলাইন রশিদের লিংক (সেখান থেকে PDF ডাউনলোড)
export function receiptText(p: any) {
  return `আসসালামু আলাইকুম ${p.client?.name || ""},\nআমিও উদ্যোক্তা-তে আপনার ${tk(p.amount)} জমা হয়েছে (রশিদ নং ${receiptNo(p.receiptNo)})।\nরশিদ দেখতে ও PDF ডাউনলোড করতে লিংকে যান:\n${receiptUrl(p.token)}\nধন্যবাদ।`;
}

// টাকা জমা নেওয়ার ফর্ম — ক্লায়েন্ট/কাজ আগে থেকে দিলে সেটাই বাছাই থাকবে
export default function ReceivePayment({ clientId, jobId, kind, onDone }: { clientId?: string; jobId?: string; kind?: "job" | "package" | "other"; onDone?: () => void }) {
  const today = new Date().toLocaleDateString("en-CA");
  const [clients, setClients] = useState<any[]>([]);
  const [cid, setCid] = useState(clientId || "");
  const [dues, setDues] = useState<any>(null);
  const [target, setTarget] = useState(kind === "package" ? "package" : jobId ? `job:${jobId}` : "");
  const [f, setF] = useState({ amount: "", method: "Cash", trxId: "", date: today, receivedBy: "", note: "" });
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!clientId) fetch("/api/clients").then(r => r.json()).then(setClients); }, [clientId]);
  useEffect(() => { if (clientId) setCid(clientId); }, [clientId]);
  const loadDues = () => cid ? fetch(`/api/dues?clientId=${cid}`).then(r => r.json()).then(setDues) : setDues(null);
  useEffect(() => { loadDues(); }, [cid]);
  useEffect(() => { if (kind === "package") setTarget("package"); else if (jobId) setTarget(`job:${jobId}`); }, [jobId, kind]);

  const pkg = dues?.packages?.[0];
  const jobs = (dues?.jobs || []).filter((j: any) => j.due > 0 || `job:${j._id}` === target);
  const options = [
    ...jobs.map((j: any) => ({ v: `job:${j._id}`, label: `${j.jobType === "edit" ? "✂ " : ""}${j.serviceType}${j.title ? " — " + j.title : ""} (${j.date}) • বকেয়া ${tk(j.due)}`, due: j.due })),
    ...(pkg ? [{ v: "package", label: `📦 প্যাকেজ: ${pkg.name} • বকেয়া ${tk(pkg.due)}`, due: pkg.due }] : []),
    { v: "other", label: "অন্যান্য / অগ্রিম (নির্দিষ্ট কাজ ছাড়া)", due: 0 },
  ];
  const sel = options.find(o => o.v === target) || (target ? options[options.length - 1] : options[0]);
  const selV = sel?.v || "";
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  async function save() {
    setMsg(""); setBusy(true);
    const [k, id] = selV.split(":");
    const r = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, clientId: cid, kind: k, jobId: id }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setMsg("❌ " + d.error);
    const newDue = sel && sel.v !== "other" ? sel.due - d.amount : null;
    setDone({ ...d, due: newDue });
    setF(p => ({ ...p, amount: "", trxId: "", note: "" }));
    loadDues(); onDone?.();
  }

  const client = clients.find(c => c._id === cid) || dues?.jobs?.[0]?.client || pkg?.client;
  return (
    <div className="pay-box">
      {!clientId && (<div style={{ marginBottom: 10 }}><label>ক্লায়েন্ট</label><ClientPicker clients={clients} value={cid} onChange={v => { setCid(v); setTarget(""); setDone(null); }} /></div>)}
      {cid && (
        <>
          <div className="grid">
            <div style={{ gridColumn: "span 2" }}><label>কিসের টাকা</label>
              <select className="input" value={selV} onChange={e => setTarget(e.target.value)}>
                {options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select></div>
            <div><label>টাকার পরিমাণ</label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <input type="number" min={0} className="input amount" placeholder="৳ 0" value={f.amount} onChange={e => set("amount", e.target.value)} />
                {sel && sel.due > 0 && <button type="button" className="btn gray" style={{ whiteSpace: "nowrap" }} onClick={() => set("amount", String(sel.due))}>পুরো বকেয়া</button>}
              </div></div>
            <div><label>তারিখ</label><input type="date" className="input" value={f.date} onChange={e => set("date", e.target.value)} /></div>
          </div>
          <label style={{ marginTop: 10 }}>কিভাবে পেয়েছেন</label>
          <div className="pills">
            {PAY_METHODS.map(m => <button type="button" key={m} className={`pill ${f.method === m ? "on" : ""}`} onClick={() => set("method", m)}>{METHOD_ICON[m]} {m}</button>)}
          </div>
          <div className="grid" style={{ marginTop: 10 }}>
            {f.method !== "Cash" && <div><label>Transaction ID / রেফারেন্স</label><input className="input" value={f.trxId} onChange={e => set("trxId", e.target.value)} /></div>}
            <div><label>কে গ্রহণ করেছেন</label><input className="input" value={f.receivedBy} onChange={e => set("receivedBy", e.target.value)} /></div>
            <div><label>নোট (ঐচ্ছিক)</label><input className="input" value={f.note} onChange={e => set("note", e.target.value)} /></div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn green" disabled={busy} onClick={save}>✔ টাকা জমা করুন{f.amount ? ` (${tk(Number(f.amount))})` : ""}</button>
            <span>{msg}</span>
          </div>
          {done && (
            <div className="pay-ok">
              ✅ <b>{tk(done.amount)}</b> জমা হয়েছে — রশিদ নং <b>{receiptNo(done.receiptNo)}</b>{done.due != null && <> | এখন বকেয়া: <b>{tk(done.due)}</b></>}
              <span className="row" style={{ marginLeft: "auto" }}>
                <Link className="btn gray" href={`/print/receipt/${done._id}`} target="_blank">🖨 রশিদ প্রিন্ট</Link>
                {client?.phone && <a className="btn wa" href={waLink(client.phone, receiptText({ ...done, client }))} target="_blank" rel="noreferrer">WhatsApp এ পাঠান</a>}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// পেমেন্ট হিস্ট্রি টেবিল (রশিদ প্রিন্ট / মোছা)
export function PaymentList({ query, reloadKey, onChange, showClient }: { query: string; reloadKey?: number; onChange?: () => void; showClient?: boolean }) {
  const [list, setList] = useState<any[]>([]);
  const load = () => fetch(`/api/payments?${query}`).then(r => r.json()).then(setList);
  useEffect(() => { load(); }, [query, reloadKey]);
  async function del(p: any) {
    if (!confirm(`রশিদ ${receiptNo(p.receiptNo)} (${tk(p.amount)}) মুছে ফেলবেন? সংশ্লিষ্ট কাজ/প্যাকেজের জমা থেকেও বাদ যাবে।`)) return;
    const r = await fetch(`/api/payments/${p._id}`, { method: "DELETE" });
    if (!r.ok) alert((await r.json()).error);
    load(); onChange?.();
  }
  const total = list.reduce((a, p) => a + (p.amount || 0), 0);
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead><tr><th>রশিদ</th><th>তারিখ</th>{showClient && <th>ক্লায়েন্ট</th>}<th>বাবদ</th><th>মাধ্যম</th><th style={{ textAlign: "right" }}>টাকা</th><th></th></tr></thead>
        <tbody>
          {list.map(p => (
            <tr key={p._id}>
              <td><b>{receiptNo(p.receiptNo)}</b></td><td>{p.date}</td>
              {showClient && <td>{p.client ? <Link href={`/clients/${p.client._id}`}>{p.client.name}</Link> : "-"}<br /><small>{p.client?.phone}</small></td>}
              <td>{p.kind === "package" ? "📦 " : p.kind === "other" ? "• " : ""}{p.label}{p.note && <><br /><small>{p.note}</small></>}</td>
              <td>{p.method}{p.trxId && <><br /><small>{p.trxId}</small></>}</td>
              <td style={{ textAlign: "right" }}><b>{tk(p.amount)}</b></td>
              <td style={{ whiteSpace: "nowrap" }}><Link href={`/print/receipt/${p._id}`} target="_blank">রশিদ</Link>
                {p.client?.phone && p.token && <> | <a href={waLink(p.client.phone, receiptText(p))} target="_blank" rel="noreferrer" style={{ color: "#16a34a" }}>WhatsApp</a></>}
                {p.token && <> | <a href="#" onClick={e => { e.preventDefault(); navigator.clipboard?.writeText(receiptUrl(p.token)); alert("লিংক কপি হয়েছে:\n" + receiptUrl(p.token)); }}>লিংক</a></>} | <a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); del(p); }}>মুছুন</a></td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={showClient ? 7 : 6}>কোনো জমা নেই</td></tr>}
          {list.length > 0 && <tr><td colSpan={showClient ? 5 : 4} style={{ textAlign: "right" }}><b>মোট</b></td><td style={{ textAlign: "right" }}><b>{tk(total)}</b></td><td></td></tr>}
        </tbody>
      </table>
    </div>
  );
}
