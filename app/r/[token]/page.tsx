"use client";
import { useEffect, useState } from "react";
import ReceiptCopy, { downloadPdf } from "@/components/ReceiptView";
import { receiptNo } from "@/lib/utils";

// ক্লায়েন্টের জন্য অনলাইন রশিদ — লগইন ছাড়া দেখা ও PDF ডাউনলোড
export default function PublicReceipt({ params }: { params: { token: string } }) {
  const [p, setP] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch(`/api/r/${params.token}`, { cache: "no-store" }).then(r => r.json()).then(setP).catch(() => setP({ error: "লোড করা যায়নি" })); }, []);
  if (!p) return <p style={{ textAlign: "center", marginTop: 40 }}>লোড হচ্ছে...</p>;
  if (p.error) return <p style={{ textAlign: "center", marginTop: 40 }}>❌ {p.error}</p>;
  async function dl() {
    setBusy(true);
    try { await downloadPdf(document.getElementById("rcpt")!, `Money-Receipt-${receiptNo(p.receiptNo)}.pdf`); } finally { setBusy(false); }
  }
  return (
    <div style={{ padding: "12px 8px 30px" }}>
      <div className="noprint" style={{ textAlign: "center", marginBottom: 10 }}>
        <p style={{ margin: "0 0 8px" }}>আসসালামু আলাইকুম {p.client?.name}, আপনার টাকা জমার রশিদ নিচে দেওয়া হলো।</p>
        <button className="btn green" disabled={busy} onClick={dl} style={{ fontSize: 16, padding: "10px 22px" }}>{busy ? "তৈরি হচ্ছে..." : "⬇ PDF ডাউনলোড করুন"}</button>{" "}
        <button className="btn gray" onClick={() => window.print()} style={{ fontSize: 16, padding: "10px 22px" }}>🖨 প্রিন্ট</button>
      </div>
      <div id="rcpt" className="rcpt"><ReceiptCopy p={p} /></div>
    </div>
  );
}
