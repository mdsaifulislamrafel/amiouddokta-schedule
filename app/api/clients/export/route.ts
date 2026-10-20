import ExcelJS from "exceljs";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Job from "@/models/Job";

export const runtime = "nodejs";

export async function GET() {
  await connectDB();
  const list: any[] = await Client.find().sort({ name: 1 }).lean();
  const counts: any[] = await Job.aggregate([{ $group: { _id: "$client", n: { $sum: 1 } } }]);
  const map = new Map(counts.map(c => [String(c._id), c.n]));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Clients");
  ws.columns = [
    { header: "#", key: "i", width: 6 },
    { header: "Name", key: "name", width: 28 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Other Phones", key: "alt", width: 28 },
    { header: "Type", key: "type", width: 18 },
    { header: "Package", key: "pkg", width: 22 },
    { header: "Monthly Hours", key: "hrs", width: 14 },
    { header: "Total Jobs", key: "jobs", width: 12 },
  ];
  list.forEach((c, i) => ws.addRow({
    i: i + 1, name: c.name, phone: c.phone, alt: (c.altPhones || []).join(", "),
    type: c.isMember ? "Premium Member" : "Regular", pkg: c.pkg?.name || "", hrs: c.pkg?.monthlyHours || "", jobs: map.get(String(c._id)) || 0,
  }));
  ws.getColumn("phone").numFmt = "@"; // ফোন নাম্বার টেক্সট হিসেবে থাকবে
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1B4B" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=clients.xlsx",
    },
  });
}
