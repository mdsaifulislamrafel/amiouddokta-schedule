"use client";
import { useEffect, useState } from "react";
import { SERVICES, EDIT_SERVICES } from "@/lib/utils";

const blank: any = { name: "", serviceType: "", price: 0, hours: 0, hoursPeriod: "month", credit: 0, durationMonths: 1, featuresText: "", termsText: "", note: "", active: true };
const lines = (t: string) => (t || "").split("\n").map(s => s.trim()).filter(Boolean);

// ক্লায়েন্টদের জন্য ডাইনামিক প্যাকেজ বানানো / এডিট / মোছা
export default function Packages() {
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState<any>(blank);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  const load = () => fetch("/api/packages").then(r => r.json()).then(setList);
  useEffect(() => { load(); }, []);

  function edit(p: any) {
    setF({ ...blank, ...p, featuresText: (p.features || []).join("\n"), termsText: (p.terms || []).join("\n") });
    setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save() {
    const { featuresText, termsText, ...rest } = f;
    const body = { ...rest, features: lines(featuresText), terms: lines(termsText) };
    const r = await fetch(f._id ? `/api/packages/${f._id}` : "/api/packages", { method: f._id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return setMsg("❌ " + (await r.json()).error);
    setMsg("✅ সেভ হয়েছে"); setF(blank); load();
  }
  async function del(p: any) {
    if (!confirm(`"${p.name}" প্যাকেজটি মুছবেন? (যেসব ক্লায়েন্টকে আগে দেওয়া হয়েছে তাদের প্যাকেজ থেকে যাবে)`)) return;
    await fetch(`/api/packages/${p._id}`, { method: "DELETE" }); load();
  }
  const num = (label: string, k: string) => <div><label>{label}</label><input type="number" min={0} className="input" value={f[k] ?? ""} onChange={e => set(k, Number(e.target.value))} /></div>;

  return (
    <>
      <div className="card">
        <h3>{f._id ? "প্যাকেজ এডিট করুন" : "নতুন প্যাকেজ বানান"}</h3>
        <div className="grid">
          <div><label>প্যাকেজের নাম</label><input className="input" placeholder="যেমন: Premium Class Recording" value={f.name} onChange={e => set("name", e.target.value)} /></div>
          <div><label>সার্ভিস</label><input className="input" list="pkgsvc" placeholder="যেমন: Class Recording" value={f.serviceType || ""} onChange={e => set("serviceType", e.target.value)} />
            <datalist id="pkgsvc">{[...SERVICES, ...EDIT_SERVICES].map(s => <option key={s} value={s} />)}</datalist></div>
          {num("প্যাকেজ মূল্য (টাকা)", "price")}
          {num("মেয়াদ (মাস)", "durationMonths")}
          {num("কত ঘন্টা কাজ পাবে", "hours")}
          <div><label>ঘন্টার হিসাব</label>
            <select className="input" value={f.hoursPeriod} onChange={e => set("hoursPeriod", e.target.value)}>
              <option value="month">প্রতি মাসে</option><option value="total">পুরো মেয়াদে মোট</option>
            </select></div>
          {num("টাকার ব্যালেন্স (অন্য কাজে খরচ করা যাবে)", "credit")}
        </div>
        <p style={{ fontSize: 13, color: "#6b7280" }}>💡 প্যাকেজের ঘন্টা বা টাকার ব্যালেন্স থেকে ক্লায়েন্ট চাইলে অন্য কাজ (যেমন বাইরের ফুটেজ এডিট) করাতে পারবে — কাজ যোগ করার সময় &quot;প্যাকেজের ঘন্টা&quot; বা &quot;প্যাকেজের টাকা&quot; বেছে নিলেই সেখান থেকে কাটবে। টাকার ব্যালেন্স না দিতে চাইলে 0 রাখুন।</p>
        <div className="grid">
          <div><label>কী কী সুবিধা পাবে / আমরা কী দেব (প্রতি লাইনে একটি)</label>
            <textarea className="input" rows={7} placeholder={"মাসে ২০ ঘন্টা ক্লাস রেকর্ডিং\nপ্রফেশনাল ক্যামেরা ও লাইট\nবেসিক এডিটিং ফ্রি\n৩ কার্যদিবসে ডেলিভারি"} value={f.featuresText} onChange={e => set("featuresText", e.target.value)} /></div>
          <div><label>এগ্রিমেন্টের শর্ত (প্রতি লাইনে একটি, ঐচ্ছিক)</label>
            <textarea className="input" rows={7} placeholder={"প্যাকেজের মূল্য অগ্রিম পরিশোধযোগ্য\nঅব্যবহৃত ঘন্টা পরের মাসে যোগ হবে না"} value={f.termsText} onChange={e => set("termsText", e.target.value)} /></div>
        </div>
        <label style={{ marginTop: 10 }}>নোট</label>
        <input className="input" value={f.note || ""} onChange={e => set("note", e.target.value)} />
        <label style={{ marginTop: 10 }}><input type="checkbox" checked={!!f.active} onChange={e => set("active", e.target.checked)} /> চালু আছে (ক্লায়েন্টকে দেওয়া যাবে)</label>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={save}>{f._id ? "আপডেট করুন" : "প্যাকেজ যোগ করুন"}</button>
          {f._id && <button className="btn gray" onClick={() => { setF(blank); setMsg(""); }}>বাতিল</button>}
          <span>{msg}</span>
        </div>
      </div>

      <div className="card">
        <h3>সব প্যাকেজ</h3>
        <table>
          <thead><tr><th>নাম</th><th>মূল্য</th><th>ঘন্টা</th><th>টাকার ব্যালেন্স</th><th>মেয়াদ</th><th>সুবিধা</th><th></th></tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p._id} style={{ opacity: p.active ? 1 : 0.55 }}>
                <td><b>{p.name}</b>{p.serviceType && <><br /><small>{p.serviceType}</small></>}{!p.active && <><br /><span className="badge">বন্ধ</span></>}</td>
                <td>৳ {p.price || 0}</td>
                <td>{p.hours || 0} ঘন্টা {p.hoursPeriod === "total" ? "(মোট)" : "/ মাস"}</td>
                <td>{p.credit ? `৳ ${p.credit}` : "-"}</td>
                <td>{p.durationMonths || 1} মাস</td>
                <td><ul style={{ margin: 0, paddingLeft: 16 }}>{(p.features || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></td>
                <td style={{ whiteSpace: "nowrap" }}><a href="#" onClick={e => { e.preventDefault(); edit(p); }}>এডিট</a> | <a href="#" style={{ color: "#dc2626" }} onClick={e => { e.preventDefault(); del(p); }}>মুছুন</a></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7}>এখনো কোনো প্যাকেজ নেই</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
