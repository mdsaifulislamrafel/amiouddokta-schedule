"use client";
import { useEffect, useState } from "react";
import PrintHeader from "@/components/PrintHeader";
import { tk, receiptNo, handoverNo, collectorCode, SETTLE_LABEL } from "@/lib/utils";

// হ্যান্ডওভার স্লিপ — গ্রহণকারী অফিসে কোন কোন রশিদের টাকা বুঝিয়ে দিল (দুই পক্ষের স্বাক্ষর)
export default function HandoverSlip({ params }: { params: { id: string } }) {
  const [h, setH] = useState<any>(null);
  useEffect(() => { fetch(`/api/handovers/${params.id}`).then(r => r.json()).then(setH); }, []);
  if (!h) return <p>Loading...</p>;
  if (h.error) return <p>{h.error}</p>;
  const c = h.collector || {};
  const ok = h.status === "received";
  return (
    <>
      <div className="noprint" style={{ textAlign: "center", marginTop: 10 }}><button className="btn" onClick={() => window.print()}>🖨 Print</button></div>
      <div className="paper">
        <PrintHeader title="Cash Handover Slip / অফিসে টাকা জমার স্লিপ" />
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          <span>Slip No: <b>{handoverNo(h.handoverNo)}</b></span>
          <span style={{ padding: "2px 12px", borderRadius: 99, fontWeight: 700, background: ok ? "#d1fae5" : "#dbeafe", color: ok ? "#065f46" : "#1e40af" }}>{ok ? "✔ RECEIVED BY OFFICE" : "⏳ PENDING VERIFICATION"} — {SETTLE_LABEL[h.status]}</span>
          <span>Date: <b>{h.date}</b></span>
        </div>
        <table>
          <tbody>
            <tr><td style={{ width: "30%" }}>Handed over by / জমাদাতা</td><td><b>{c.name}</b> — {c.designation} ({collectorCode(c.code)}) • {c.phone}</td></tr>
            <tr><td>Method / মাধ্যম</td><td>{h.method}{h.trxId && ` (Trx: ${h.trxId})`}</td></tr>
            {ok && <tr><td>Received by (Office) / অফিসে গ্রহণকারী</td><td><b>{h.receivedBy}</b>{h.receivedAt && ` • ${new Date(h.receivedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}</td></tr>}
            {h.note && <tr><td>Note</td><td>{h.note}</td></tr>}
          </tbody>
        </table>
        <h3>রশিদের তালিকা ({h.payments.length} টি)</h3>
        <table>
          <thead><tr><th>#</th><th>Receipt</th><th>Date</th><th>Client</th><th>For</th><th>Method</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
          <tbody>
            {h.payments.map((p: any, i: number) => (
              <tr key={p._id}><td>{i + 1}</td><td>{receiptNo(p.receiptNo)}</td><td>{p.date}</td><td>{p.client?.name}<br /><small>{p.client?.phone}</small></td><td>{p.label}</td><td>{p.method}</td><td style={{ textAlign: "right" }}>{tk(p.amount)}</td></tr>))}
            <tr><td colSpan={6} style={{ textAlign: "right" }}><b>Total / মোট</b></td><td style={{ textAlign: "right" }}><b style={{ fontSize: 16 }}>{tk(h.amount)}</b></td></tr>
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 60, gap: 40 }}>
          <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center", fontSize: 12 }}>জমাদাতার স্বাক্ষর ({c.name})</div>
          <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center", fontSize: 12 }}>অফিসে গ্রহণকারীর স্বাক্ষর{h.receivedBy && ` (${h.receivedBy})`}</div>
        </div>
      </div>
    </>
  );
}
