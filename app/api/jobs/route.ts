import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Job from "@/models/Job";
import { FIELDS } from "@/lib/jobFields";
import { findConflict, conflictMessage } from "@/lib/conflict";
import { assignPackage } from "@/lib/packages";
import { createPayment } from "@/lib/payments";

export async function GET(req: Request) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q: any = {};
  ["status", "serviceType", "jobType"].forEach(k => sp.get(k) && (q[k] = sp.get(k)));
  if (q.jobType === "shoot") q.jobType = { $ne: "edit" }; // পুরোনো কাজে jobType নেই, সেগুলো শুটিং
  if (sp.get("clientId")) q.client = sp.get("clientId");
  if (sp.get("from") || sp.get("to")) q.date = { ...(sp.get("from") && { $gte: sp.get("from") }), ...(sp.get("to") && { $lte: sp.get("to") }) };
  return NextResponse.json(await (Job as any).find(q).populate("client", "name phone isMember").sort({ date: -1, startTime: -1 }).limit(500).lean());
}

export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();

  // একই সময়ে অন্য কাজ আছে কিনা (ক্লায়েন্ট তৈরির আগেই চেক) — শুধু এডিটের কাজে স্টুডিও লাগে না তাই চেক নেই
  const clash = b.jobType === "edit" ? null : await findConflict(b.date, b.startTime, b.endTime);
  if (clash) return NextResponse.json({ error: conflictMessage(clash) }, { status: 409 });

  let clientId = b.clientId;
  if (!clientId) {
    if (!b.newName || !b.newPhone) return NextResponse.json({ error: "ক্লায়েন্টের নাম ও নাম্বার দিন" }, { status: 400 });
    const ClientModel: any = Client;
    let c: any = await ClientModel.findOne({ phone: b.newPhone });
    if (!c) c = await ClientModel.create({ name: b.newName, phone: b.newPhone });
    clientId = c._id;
  }
  const data: any = { client: clientId };
  FIELDS.forEach(k => b[k] !== undefined && (data[k] = b[k]));
  // সার্ভিসের জায়গায় প্যাকেজ বাছাই করলে ক্লায়েন্টকে সেই প্যাকেজ দেওয়া হবে, কাজ প্যাকেজের ঘন্টা থেকে কাটবে
  if (b.assignPackageId) {
    const t = await assignPackage(clientId, b.assignPackageId, b.date);
    if (t) Object.assign(data, { packageId: t._id, packageName: t.name, usePackage: true });
  }
  // প্যাকেজ নেওয়ার সময় অগ্রিম দিলে সেটা প্যাকেজের মূল্যে জমা হবে
  const pkgAdvance = data.packageId && Number(b.paid) > 0 ? Number(b.paid) : 0;
  if (pkgAdvance) data.paid = 0;
  const job = await new Job(data).save();
  if (pkgAdvance) await createPayment({ client: clientId, job: job._id, kind: "package", label: `Package: ${data.packageName}`, amount: pkgAdvance, method: b.payMethod || "Cash", date: new Date().toLocaleDateString("en-CA"), note: "Advance" });
  // কাজ তৈরির সময় অগ্রিম নিলে রশিদ রেকর্ড
  if (job.paid > 0 && !(job.usePackage && job.deductFrom === "money"))
    await createPayment({ client: clientId, job: job._id, kind: "job", label: `${job.serviceType}${job.title ? " — " + job.title : ""} (${job.date})`, amount: job.paid, method: b.payMethod || "Cash", date: new Date().toLocaleDateString("en-CA"), note: "Advance" }, false);
  return NextResponse.json(job);
}