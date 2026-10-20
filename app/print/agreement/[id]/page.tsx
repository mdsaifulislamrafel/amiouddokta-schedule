"use client";
import { useEffect, useState } from "react";
import PrintHeader from "@/components/PrintHeader";
import { fmt12, fmtDur, calcMinutes } from "@/lib/utils";

const tint = (rgb: string, a = 0.1) => `rgba(${rgb},${a})`;

export default function Agreement({ params }: { params: { id: string } }) {
  const [j, setJ] = useState<any>(null);
  useEffect(() => { fetch(`/api/jobs/${params.id}`).then(r => r.json()).then(setJ); }, []);
  if (!j) return <p>লোড হচ্ছে...</p>;

  const planned = calcMinutes(j.startTime, j.endTime);
  const due = (j.charge || 0) - (j.paid || 0);
  const today = new Date().toLocaleDateString("en-GB");
  const terms = [
    "কাজের তারিখ, সময় ও লোকেশন উভয়পক্ষের সম্মতিতে নির্ধারিত হয়েছে।",
    "শিডিউল পরিবর্তন করতে চাইলে কমপক্ষে ২৪ ঘন্টা আগে জানাতে হবে।",
    "নির্ধারিত সময়ের বেশি সময় লাগলে অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।",
    "কাজ সম্পন্ন হওয়ার পর Google Drive লিংকের মাধ্যমে ডেলিভারি দেওয়া হবে।",
    "ডেলিভারির সম্ভাব্য সময় অনুমানভিত্তিক; কাজের পরিমাণ অনুযায়ী কিছুটা পরিবর্তন হতে পারে।",
    "ক্লায়েন্টের সরবরাহ করা কনটেন্ট, স্ক্রিপ্ট, মডেল ও পণ্যের বৈধতার দায়ভার ক্লায়েন্টের।",
    "শুট শুরুর পর বুকিং বাতিল করলে অগ্রিম অর্থ ফেরতযোগ্য নয়।",
    "মোট চার্জের বকেয়া অংশ ডেলিভারির পূর্বে পরিশোধ করতে হবে।",
  ];
  const rows: [string, React.ReactNode][] = [
    ["সার্ভিস", <b key="s">{j.serviceType}{j.title ? ` — ${j.title}` : ""}</b>],
    ["তারিখ", j.date],
    ["সময়", `${fmt12(j.startTime)} - ${fmt12(j.endTime)}${planned != null ? ` (${fmtDur(planned)})` : ""}`],
    ["লোকেশন", j.location || "-"],
    ["দায়িত্বপ্রাপ্ত", j.assignedTo || "-"],
    ["ডেলিভারি", `${j.expectedDeliveryDate || "-"}${j.deliveryEstimate ? ` (${j.deliveryEstimate})` : ""} — Google Drive লিংকের মাধ্যমে`],
  ];
  const box = (label: string, value: number, rgb: string, color: string) => (
    <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: tint(rgb, 0.12), border: `1px solid ${tint(rgb, 0.45)}` }}>
      <div style={{ fontSize: 12, color }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>৳ {value}</div>
    </div>
  );

  return (
    <>
      <div className="noprint" style={{ textAlign: "center", marginTop: 10 }}>
        <button className="btn" onClick={() => window.print()}>🖨 প্রিন্ট করুন (A4)</button>
      </div>
      <div className="paper">
        <PrintHeader title="সার্ভিস চুক্তিপত্র (Service Agreement)" />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#4b5563", marginBottom: 8 }}>
          <span>📅 তারিখ: <b>{today}</b></span>
          <span>🔖 রেফারেন্স: <b>{String(j._id).slice(-6).toUpperCase()}</b></span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: tint("67,56,202", 0.08), borderLeft: "4px solid #4338ca" }}>
            <div style={{ fontSize: 11, color: "#4338ca", fontWeight: 700 }}>সেবাদাতা</div>
            <b>আমিও উদ্যোক্তা</b><br />+8801685295669<br />www.amiouddokta.com
          </div>
          <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: tint("5,150,105", 0.08), borderLeft: "4px solid #059669" }}>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>ক্লায়েন্ট</div>
            <b>{j.client?.name}</b><br />ফোন: {j.client?.phone}
            {j.deliveryPhone && <><br />ডেলিভারি নাম্বার: {j.deliveryPhone}</>}
          </div>
        </div>

        <p style={{ margin: "10px 0 6px" }}>উপরোক্ত উভয়পক্ষ নিম্নলিখিত কাজ ও শর্তে সম্মত হলো:</p>

        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <th style={{ width: "26%", background: tint("67,56,202", 0.1), color: "#3730a3" }}>{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          {box("মোট চার্জ", j.charge || 0, "67,56,202", "#3730a3")}
          {box("পরিশোধিত / অগ্রিম", j.paid || 0, "5,150,105", "#047857")}
          {box("বকেয়া", due, due > 0 ? "220,38,38" : "5,150,105", due > 0 ? "#b91c1c" : "#047857")}
        </div>

        {j.optionalNote && <p style={{ background: tint("245,158,11", 0.12), padding: "6px 10px", borderRadius: 8, margin: "0 0 8px" }}><b>নোট:</b> {j.optionalNote}</p>}

        <div style={{ background: tint("245,158,11", 0.1), border: "1px solid rgba(245,158,11,.4)", borderRadius: 10, padding: "8px 14px" }}>
          <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 4 }}>📋 শর্তাবলি</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, columnCount: 2, columnGap: 22 }}>
            {terms.map(t => <li key={t} style={{ marginBottom: 3, breakInside: "avoid" }}>{t}</li>)}
          </ol>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 56, gap: 40 }}>
          <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center" }}>ক্লায়েন্টের স্বাক্ষর<br /><small>{j.client?.name}</small></div>
          <div style={{ flex: 1, borderTop: "2px solid #4338ca", paddingTop: 4, textAlign: "center" }}>সেবাদাতার স্বাক্ষর<br /><small>আমিও উদ্যোক্তা</small></div>
        </div>
      </div>
    </>
  );
}