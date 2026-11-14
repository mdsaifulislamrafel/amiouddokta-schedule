"use client";
import { useEffect, useState } from "react";
import ReceiptCopy, { receiptUrl } from "@/components/ReceiptView";
import { waLink } from "@/lib/utils";
import { receiptText } from "@/components/ReceivePayment";

// মানি রিসিট (টাকা জমার রশিদ) — A4, দুই কপি (ক্লায়েন্ট / অফিস)
export default function Receipt({ params }: { params: { id: string } }) {
  const [p, setP] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { fetch(`/api/payments/${params.id}`).then(r => r.json()).then(setP); }, []);
  if (!p) return <p>Loading...</p>;
  if (p.error) return <p>{p.error}</p>;
  const c = p.client || {};
  const url = receiptUrl(p.token);
  return (
    <>
      <div className="noprint" style={{ textAlign: "center", marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={() => window.print()}>🖨 Print Receipt</button>
        {c.phone && <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(c.phone, receiptText(p))}>WhatsApp এ লিংক পাঠান</a>}
        <button className="btn gray" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); }}>{copied ? "✔ কপি হয়েছে" : "🔗 অনলাইন লিংক কপি"}</button>
        <a className="btn gray" href={url} target="_blank" rel="noreferrer">ক্লায়েন্ট যা দেখবে</a>
      </div>
      <div className="paper">
        <ReceiptCopy p={p} label="Client Copy" />
        <div style={{ borderTop: "2px dashed #9ca3af", margin: "6px 0 14px", textAlign: "center", fontSize: 11, color: "#9ca3af" }}>✂ ---------------- কেটে নিন ----------------</div>
        <ReceiptCopy p={p} label="Office Copy" />
      </div>
    </>
  );
}
