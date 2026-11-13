"use client";
import { useEffect, useState } from "react";
import PrintHeader from "@/components/PrintHeader";

const tint = (rgb: string, a = 0.1) => `rgba(${rgb},${a})`;
const DEFAULT_TERMS = [
  "The package price must be paid as agreed before the package period starts.",
  "Package hours and benefits are valid only within the package period.",
  "Shooting schedules must be booked in advance and are subject to availability.",
  "With the client's consent, other services (e.g. editing of footage shot elsewhere or by the client) may be deducted from the package hours or package balance.",
  "Work beyond the package hours or balance will be charged separately.",
  "Unused hours or balance are not refundable after the package period ends.",
  "All deliveries will be made through Google Drive links.",
];

// ক্লায়েন্টের প্যাকেজ এগ্রিমেন্ট (প্যাকেজের সুবিধার লিস্ট সহ)
export default function PackageAgreement({ params }: { params: { id: string } }) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch(`/api/clients/${params.id}`).then(r => r.json()).then(setD); }, []);
  if (!d) return <p>Loading...</p>;
  const c = d.client, p = c.pkg || {};
  const terms = p.terms?.length ? p.terms : DEFAULT_TERMS;
  const due = (p.price || 0) - (p.paid || 0);
  const today = new Date().toLocaleDateString("en-GB");
  const rows: [string, React.ReactNode][] = [
    ["Package", <b key="n">{p.name || "-"}</b>],
    ...(p.serviceType ? [["Service", p.serviceType] as [string, React.ReactNode]] : []),
    ["Package Period", `${p.startDate || "-"} to ${p.endDate || "-"}`],
    ["Included Hours", `${p.monthlyHours || 0} hours ${p.hoursPeriod === "total" ? "(total for the whole period)" : "per month"}`],
    ...(p.credit ? [["Service Balance", `৳ ${p.credit} (usable for other services such as editing)`] as [string, React.ReactNode]] : []),
  ];
  const box = (label: string, value: number, rgb: string, color: string) => (
    <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: tint(rgb, 0.12), border: `1px solid ${tint(rgb, 0.45)}` }}>
      <div style={{ fontSize: 12, color }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>৳ {value}</div>
    </div>
  );
  const sign = (t: string, n: string) => (
    <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center" }}>{t}<br /><small>{n}</small></div>
  );

  return (
    <>
      <div className="noprint" style={{ textAlign: "center", marginTop: 10 }}><button className="btn" onClick={() => window.print()}>🖨 Print Package Agreement (A4)</button></div>
      <div className="paper">
        <PrintHeader title="Package Agreement" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#4b5563", marginBottom: 8 }}>
          <span>📅 Date: <b>{today}</b></span>
          <span>🔖 Reference: <b>PKG-{String(c._id).slice(-6).toUpperCase()}</b></span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: tint("67,56,202", 0.08), borderLeft: "4px solid #4338ca" }}>
            <div style={{ fontSize: 11, color: "#4338ca", fontWeight: 700 }}>Service Provider</div>
            <b>Amio Uddokta</b><br />+8801685295669<br />www.amiouddokta.com
          </div>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: tint("5,150,105", 0.08), borderLeft: "4px solid #059669" }}>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Client</div>
            <b>{c.name}</b><br />Phone: {c.phone}{c.altPhones?.length ? <><br />Other: {c.altPhones.join(", ")}</> : null}
          </div>
        </div>
        <p style={{ margin: "10px 0 6px" }}>Both parties agree to the following package, benefits and terms:</p>
        <table>
          <tbody>{rows.map(([k, v]) => (
            <tr key={k}><th style={{ width: "26%", background: tint("67,56,202", 0.1), color: "#3730a3" }}>{k}</th><td>{v}</td></tr>
          ))}</tbody>
        </table>
        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          {box("Package Price", p.price || 0, "67,56,202", "#3730a3")}
          {box("Paid / Advance", p.paid || 0, "5,150,105", "#047857")}
          {box("Due Balance", due, due > 0 ? "220,38,38" : "5,150,105", due > 0 ? "#b91c1c" : "#047857")}
        </div>
        {p.features?.length > 0 && (
          <div style={{ background: tint("5,150,105", 0.08), border: "1px solid rgba(5,150,105,.35)", borderRadius: 10, padding: "8px 14px", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, color: "#047857", marginBottom: 4 }}>✅ Package Benefits (What We Provide)</div>
            <ol style={{ margin: 0, paddingLeft: 18 }}>{p.features.map((x: string, i: number) => <li key={i} style={{ marginBottom: 2 }}>{x}</li>)}</ol>
          </div>
        )}
        <div style={{ background: tint("245,158,11", 0.1), border: "1px solid rgba(245,158,11,.4)", borderRadius: 10, padding: "8px 14px" }}>
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>📋 Terms and Conditions</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>{terms.map((t: string, i: number) => <li key={i} style={{ marginBottom: 3 }}>{t}</li>)}</ol>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 56, gap: 40 }}>
          {sign("Client Signature", c.name)}
          {sign("Service Provider Signature", "Amio Uddokta")}
        </div>
      </div>
    </>
  );
}
