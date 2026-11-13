"use client";
import { useEffect, useState } from "react";
import PrintHeader from "@/components/PrintHeader";
import { fmt12, fmtDur, billingLabel } from "@/lib/utils";

export default function ClientPrint({ params }: { params: { id: string } }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch(`/api/clients/${params.id}`).then(r => r.json()).then(setD); }, []);
  if (!d) return <p>লোড হচ্ছে...</p>;
  const c = d.client;
  const rows = [...d.ledger].reverse(); // পুরোনো থেকে নতুন
  const allowed = (c.pkg?.monthlyHours || 0) * 60;
  return (
    <>
      <div className="noprint" style={{ textAlign: "center", marginTop: 10 }}><button className="btn" onClick={() => window.print()}>🖨 প্রিন্ট করুন</button></div>
      <div className="paper">
        <PrintHeader title="ক্লায়েন্ট শিডিউল ও হিসাব" />
        <p><b>{c.name}</b> — {c.phone} {c.isMember && "(Premium Member)"}</p>
        {c.isMember && <p>প্যাকেজ: {c.pkg?.name || "-"} | মূল্য: {c.pkg?.price || 0} টাকা | {c.pkg?.hoursPeriod === "total" ? "মোট" : "মাসে"} {c.pkg?.monthlyHours || 0} ঘন্টা{c.pkg?.credit ? ` | টাকার ব্যালেন্স: ${c.pkg.credit} (খরচ ${d.moneyUsed}, বাকি ${c.pkg.credit - d.moneyUsed})` : ""}</p>}
        <table>
          <thead><tr><th>তারিখ</th><th>সার্ভিস</th><th>সময়</th><th>মোট</th><th>ধরন</th><th>নোট</th></tr></thead>
          <tbody>{rows.map((r: any, i: number) => (
            <tr key={i}><td>{r.date}</td><td>{r.jobType === "edit" ? "✂ " : ""}{r.serviceType}</td><td>{r.start ? `${fmt12(r.start)} - ${fmt12(r.end)}` : "-"}</td><td>{fmtDur(r.minutes)}</td><td>{billingLabel(r)}</td><td>{r.note}</td></tr>))}</tbody>
        </table>
        <h3>সারসংক্ষেপ</h3>
        <p>মোট শুটিং সময়: <b>{fmtDur(d.totalMinutes)}</b></p>
        {c.isMember && c.pkg?.hoursPeriod === "total" && <p>প্যাকেজের ঘন্টা থেকে ব্যবহার (পুরো মেয়াদে): <b>{fmtDur(d.periodMinutes)}</b> / {c.pkg?.monthlyHours || 0} ঘন্টা</p>}
        {c.isMember && c.pkg?.hoursPeriod !== "total" && <table><thead><tr><th>মাস</th><th>ব্যবহৃত</th><th>বাকি</th></tr></thead><tbody>{Object.entries(d.usage).sort().map(([m, v]: any) => <tr key={m}><td>{m}</td><td>{fmtDur(v)}</td><td>{allowed ? fmtDur(Math.max(0, allowed - v)) : "-"}</td></tr>)}</tbody></table>}
        <p>এক্সট্রা সার্ভিস চার্জ: {d.extraCharge} টাকা | পরিশোধিত: {d.extraPaid} টাকা | বকেয়া: {d.extraCharge - d.extraPaid} টাকা</p>
      </div>
    </>
  );
}
