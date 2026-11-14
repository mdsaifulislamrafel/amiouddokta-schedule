import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import Client from "@/models/Client";
import Payment from "@/models/Payment";
import { calcMinutes, sumMinutes } from "@/lib/utils";
import { FIELDS } from "@/lib/jobFields";
import { findConflict, conflictMessage } from "@/lib/conflict";
import { assignPackage } from "@/lib/packages";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  void Client;
  const doc: any = await Job.findById(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // পুরোনো (এক টাইম) ডেটা অটো সেশনে রূপান্তর
  if (!doc.sessions.length && doc.actualStart && doc.actualEnd) {
    doc.sessions.push({ date: doc.date, start: doc.actualStart, end: doc.actualEnd, minutes: calcMinutes(doc.actualStart, doc.actualEnd) });
    doc.durationMinutes = sumMinutes(doc.sessions);
    doc.actualStart = undefined; doc.actualEnd = undefined;
    await doc.save();
  }
  return NextResponse.json(await Job.findById(params.id).populate("client").lean());
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const b = await req.json();
  const job: any = await Job.findById(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  FIELDS.forEach(k => k !== "paid" && b[k] !== undefined && (job[k] = b[k])); // paid শুধু টাকা জমার রশিদ থেকে বদলায়
  if (b.clientId) job.client = b.clientId;
  if (b.assignPackageId) {
    const t = await assignPackage(job.client, b.assignPackageId, job.date);
    if (t) { job.packageId = t._id; job.packageName = t.name; job.usePackage = true; }
  }
  job.durationMinutes = sumMinutes(job.sessions);
  const a = b.action;

  // সাধারণ সেভ বা Approve এর সময় একই সময়ের অন্য কাজ চেক (নিজেকে বাদ দিয়ে)
  if ((!a || a === "approve") && job.status !== "rejected" && job.jobType !== "edit") {
    const clash = await findConflict(job.date, job.startTime, job.endTime, String(job._id));
    if (clash) return NextResponse.json({ error: conflictMessage(clash) }, { status: 409 });
  }

  if (a === "approve") { job.status = "approved"; job.approvedAt = new Date(); }
  if (a === "reject") job.status = "rejected";
  if (a === "complete") {
    const isEdit = job.jobType === "edit";
    // শুটিংয়ে সেশন লাগবেই; এডিটে শুধু প্যাকেজের ঘন্টা থেকে কাটলে এডিটের সময় লাগবে
    if (!job.sessions.length && (!isEdit || (job.usePackage && job.deductFrom !== "money")))
      return NextResponse.json({ error: isEdit ? "প্যাকেজের ঘন্টা থেকে কাটতে অন্তত একটি এডিটিং সময় যোগ করুন" : "অন্তত একটি শুটিং সেশন (তারিখ, শুরু ও শেষের সময়) যোগ করুন" }, { status: 400 });
    job.status = "completed"; job.completedAt = new Date();
  }
  if (a === "deliver") {
    if (!job.driveLinks?.length) return NextResponse.json({ error: "ডেলিভারি নোটে অন্তত একটি Google Drive লিংক দিন" }, { status: 400 });
    job.status = "delivered"; job.deliveredAt = new Date();
  }
  if (a === "reopen") { job.status = "completed"; job.deliveredAt = undefined; } // রিভিশন / আবার কাজের জন্য
  await job.save();
  return NextResponse.json(await Job.findById(params.id).populate("client").lean());
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const j: any = await Job.findById(params.id);
  if (!j) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Job.findByIdAndDelete(params.id);
  await Payment.updateMany({ job: params.id }, { $set: { kind: "other" }, $unset: { job: 1 } }); // রশিদ থেকে যাবে
  return NextResponse.json({ ok: true });
}