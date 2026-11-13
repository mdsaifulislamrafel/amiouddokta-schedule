
"use client";

import { useEffect, useState } from "react";
import PrintHeader from "@/components/PrintHeader";
import { fmt12, fmtDur, calcMinutes } from "@/lib/utils";

const tint = (rgb: string, a = 0.1) => `rgba(${rgb},${a})`;

export default function Agreement({ params }: { params: { id: string } }) {
  const [j, setJ] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/jobs/${params.id}`)
      .then((r) => r.json())
      .then(setJ);
  }, []);

  if (!j) return <p>Loading...</p>;

  const planned = calcMinutes(j.startTime, j.endTime);
  const due = (j.charge || 0) - (j.paid || 0);
  const today = new Date().toLocaleDateString("en-GB");

  const isEdit = j.jobType === "edit";
  const fromMoney = j.usePackage && j.deductFrom === "money";
  const editTerms = [
    "The client provides the raw footage; the client is responsible for its quality, ownership and legality.",
    "Editing will follow the instructions agreed at the time of booking; major changes may cost extra.",
    "Minor revisions are included; additional revision rounds may be charged separately.",
    "The edited video will be delivered through a Google Drive link.",
    "The estimated delivery time is approximate and may vary depending on footage length and workload.",
    "Raw footage may be removed from our storage 30 days after delivery.",
    "The remaining balance must be paid before delivery.",
  ];
  const shootTerms = [
    "The work date, time, and location have been determined by mutual agreement between both parties.",
    "Any schedule changes must be communicated at least 24 hours in advance.",
    "Additional charges may apply if the work exceeds the scheduled duration.",
    "The completed work will be delivered through a Google Drive link.",
    "The estimated delivery time is approximate and may vary depending on the workload.",
    "The client is responsible for the legality of all content, scripts, models, and products provided by them.",
    "The advance payment is non-refundable if the booking is canceled after the shoot has started.",
    "The remaining balance must be paid before delivery.",
  ];
  const terms = isEdit ? editTerms : shootTerms;
  const billing = !j.usePackage ? "Separate charge (not from package)"
    : fromMoney ? `Deducted from package balance${j.client?.pkg?.name ? ` (${j.client.pkg.name})` : ""}`
    : `Deducted from package hours${j.client?.pkg?.name ? ` (${j.client.pkg.name})` : ""}`;

  const rows: [string, React.ReactNode][] = [
    [
      "Service",
      <b key="s">
        {j.serviceType}
        {j.title ? ` — ${j.title}` : ""}
      </b>,
    ],
    ...(isEdit
      ? ([
          ["Work Type", "Editing only (client-provided footage)"],
          ["Footage Source", j.footageSource === "other_studio" ? "Shot elsewhere" : "Shot by client"],
          ["Footage Received", j.date],
          ["Editor", j.assignedTo || "-"],
          ...(j.footageNote ? [["Instructions", j.footageNote]] : []),
          ...(j.durationMinutes ? [["Editing Time", fmtDur(j.durationMinutes)]] : []),
        ] as [string, React.ReactNode][])
      : ([
          ["Date", j.date],
          [
            "Time",
            `${fmt12(j.startTime)} - ${fmt12(j.endTime)}${
              planned != null ? ` (${fmtDur(planned)})` : ""
            }`,
          ],
          ["Location", j.location || "-"],
          ["Assigned To", j.assignedTo || "-"],
        ] as [string, React.ReactNode][])),
    ["Billing", billing],
    [
      "Delivery",
      `${j.expectedDeliveryDate || "-"}${
        j.deliveryEstimate ? ` (${j.deliveryEstimate})` : ""
      } — Via Google Drive link`,
    ],
  ];

  const box = (
    label: string,
    value: number,
    rgb: string,
    color: string
  ) => (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "8px 6px",
        borderRadius: 10,
        background: tint(rgb, 0.12),
        border: `1px solid ${tint(rgb, 0.45)}`,
      }}
    >
      <div style={{ fontSize: 12, color }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>
        ৳ {value}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="noprint"
        style={{ textAlign: "center", marginTop: 10 }}
      >
        <button className="btn" onClick={() => window.print()}>
          🖨 Print Agreement (A4)
        </button>
      </div>

      <div className="paper">
        <PrintHeader title="Service Agreement" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#4b5563",
            marginBottom: 8,
          }}
        >
          <span>
            📅 Date: <b>{today}</b>
          </span>

          <span>
            🔖 Reference:{" "}
            <b>{String(j._id).slice(-6).toUpperCase()}</b>
          </span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              background: tint("67,56,202", 0.08),
              borderLeft: "4px solid #4338ca",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Service Provider
            </div>

            <b>Amio Uddokta</b>
            <br />
            +8801685295669
            <br />
            www.amiouddokta.com
          </div>

          <div
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              background: tint("5,150,105", 0.08),
              borderLeft: "4px solid #059669",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#059669",
                fontWeight: 700,
              }}
            >
              Client
            </div>

            <b>{j.client?.name}</b>
            <br />
            Phone: {j.client?.phone}
            {j.deliveryPhone && (
              <>
                <br />
                Delivery Phone: {j.deliveryPhone}
              </>
            )}
          </div>
        </div>

        <p style={{ margin: "10px 0 6px" }}>
          Both parties agree to the following work details and terms:
        </p>

        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <th
                  style={{
                    width: "26%",
                    background: tint("67,56,202", 0.1),
                    color: "#3730a3",
                  }}
                >
                  {k}
                </th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
          {box(fromMoney ? "From Package Balance" : "Total Charge", j.charge || 0, "67,56,202", "#3730a3")}

          {!fromMoney && box(
            "Paid / Advance",
            j.paid || 0,
            "5,150,105",
            "#047857"
          )}

          {!fromMoney && box(
            "Due Balance",
            due,
            due > 0 ? "220,38,38" : "5,150,105",
            due > 0 ? "#b91c1c" : "#047857"
          )}
        </div>

        {j.optionalNote && (
          <p
            style={{
              background: tint("245,158,11", 0.12),
              padding: "6px 10px",
              borderRadius: 8,
              margin: "0 0 8px",
            }}
          >
            <b>Note:</b> {j.optionalNote}
          </p>
        )}

        <div
          style={{
            background: tint("245,158,11", 0.1),
            border: "1px solid rgba(245,158,11,.4)",
            borderRadius: 10,
            padding: "8px 14px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#92400e",
              marginBottom: 4,
            }}
          >
            📋 Terms and Conditions
          </div>

          <ol
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 12,
              columnCount: 2,
              columnGap: 22,
            }}
          >
            {terms.map((t) => (
              <li
                key={t}
                style={{ marginBottom: 3, breakInside: "avoid" }}
              >
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 56,
            gap: 40,
          }}
        >
          <div
            style={{
              flex: 1,
              borderTop: "2px solid #4338ca",
              paddingTop: 4,
              textAlign: "center",
            }}
          >
            Client Signature
            <br />
            <small>{j.client?.name}</small>
          </div>

          <div
            style={{
              flex: 1,
              borderTop: "2px solid #4338ca",
              paddingTop: 4,
              textAlign: "center",
            }}
          >
            Service Provider Signature
            <br />
            <small>Amio Uddokta</small>
          </div>
        </div>
      </div>
    </>
  );
}