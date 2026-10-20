import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import Client from "@/models/Client";
import { calcMinutes, sumMinutes } from "@/lib/utils";
import { FIELDS } from "@/lib/jobFields";

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
  if (job.status === "delivered") return NextResponse.json({ error: "ডেলিভারি হয়ে যাওয়া কাজ এডিট করা যাবে না" }, { status: 400 });
  FIELDS.forEach(k => b[k] !== undefined && (job[k] = b[k]));
  if (b.clientId) job.client = b.clientId;
  job.durationMinutes = sumMinutes(job.sessions);
  const a = b.action;
  if (a === "approve") { job.status = "approved"; job.approvedAt = new Date(); }
  if (a === "reject") job.status = "rejected";
  if (a === "complete") {
    if (!job.sessions.length) return NextResponse.json({ error: "অন্তত একটি শুটিং সেশন (তারিখ, শুরু ও শেষের সময়) যোগ করুন" }, { status: 400 });
    job.status = "completed"; job.completedAt = new Date();
  }
  if (a === "deliver") {
    if (!job.driveLinks?.length) return NextResponse.json({ error: "ডেলিভারি নোটে অন্তত একটি Google Drive লিংক দিন" }, { status: 400 });
    job.status = "delivered"; job.deliveredAt = new Date();
  }
  await job.save();
  return NextResponse.json(await Job.findById(params.id).populate("client").lean());
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const j: any = await Job.findById(params.id);
  if (!j) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (j.status === "delivered") return NextResponse.json({ error: "ডেলিভারি হয়ে যাওয়া কাজ মোছা যাবে না" }, { status: 400 });
  await Job.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}