"use client";
import PrintHeader from "@/components/PrintHeader";
import { receiptNo } from "@/lib/utils";

const money = (n?: number) => "৳ " + Math.round(n || 0).toLocaleString("en-IN");

export const SITE_URL = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.amiouddokta.com").replace(/\/$/, "");
export const receiptUrl = (token: string) => `${SITE_URL()}/r/${token}`;

// রশিদের এক কপি — অফিসের প্রিন্ট আর ক্লায়েন্টের অনলাইন লিংক দুই জায়গাতেই এটা
export default function ReceiptCopy({ p, label }: { p: any; label?: string }) {
  const c = p.client || {};
  const row = (k: string, v: React.ReactNode) => (
    <tr><td style={{ padding: "5px 8px", color: "#4b5563", width: "38%", borderBottom: "1px dashed #e5e7eb" }}>{k}</td><td style={{ padding: "5px 8px", borderBottom: "1px dashed #e5e7eb", wordBreak: "break-word" }}>{v}</td></tr>
  );
  return (
    <div style={{ position: "relative", padding: "0 0 14px" }}>
      <PrintHeader title="Money Receipt / টাকা জমার রশিদ" />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, fontSize: 13, marginBottom: 6 }}>
        <span>Receipt No: <b>{receiptNo(p.receiptNo)}</b></span>{label && <span style={{ color: "#6b7280" }}>{label}</span>}<span>Date: <b>{p.date}</b></span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {row("Received from / গ্রাহক", <b>{c.name}</b>)}
          {row("Phone", c.phone)}
          {row("For / বাবদ", p.label || "-")}
          {row("Payment Method", `${p.method}${p.trxId ? ` (Trx: ${p.trxId})` : ""}`)}
          {p.receivedBy && row("Received by", p.receivedBy)}
          {p.note && row("Note", p.note)}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1, textAlign: "center", padding: 8, borderRadius: 10, background: "rgba(5,150,105,.1)", border: "1px solid rgba(5,150,105,.45)", color: "#047857" }}>
          <div style={{ fontSize: 12 }}>Amount Received / জমা</div><div style={{ fontSize: 24, fontWeight: 700 }}>{money(p.amount)}</div></div>
        {p.due != null && <div style={{ flex: 1, textAlign: "center", padding: 8, borderRadius: 10, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.4)", color: "#b91c1c" }}>
          <div style={{ fontSize: 12 }}>Current Due / বর্তমান বকেয়া</div><div style={{ fontSize: 24, fontWeight: 700 }}>{money(Math.max(0, p.due))}</div></div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, gap: 40 }}>
        <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center", fontSize: 12 }}>Client Signature</div>
        <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center", fontSize: 12 }}>Authorized Signature</div>
      </div>
    </div>
  );
}

// রশিদ PDF হিসেবে ডাউনলোড (ব্রাউজারেই তৈরি হয়, বাংলা ফন্ট ঠিক থাকে)
export async function downloadPdf(el: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const canvas = await html2canvas(el, {
    scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 820,
    onclone: (doc: Document) => { const c = doc.getElementById(el.id); if (c) { c.style.width = "760px"; c.style.maxWidth = "none"; c.style.boxShadow = "none"; c.style.margin = "0"; } },
  });
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const w = 190, h = (canvas.height * w) / canvas.width;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 10, 10, w, Math.min(h, 277));
  pdf.save(fileName);
}
