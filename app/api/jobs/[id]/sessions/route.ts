import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import { calcMinutes, sumMinutes } from "@/lib/utils";

// নতুন শুটিং সেশন যোগ (একই কাজে একাধিক দিনের সময় জমা হবে)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const { date, start, end, note } = await req.json();
  if (!date || !start || !end) return NextResponse.json({ error: "তারিখ, শুরু ও শেষের সময় দিন" }, { status: 400 });
  const job: any = await Job.findById(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status === "delivered") return NextResponse.json({ error: "ডেলিভারি হয়ে যাওয়া কাজে সেশন যোগ করা যাবে না" }, { status: 400 });
  if (job.status === "rejected") return NextResponse.json({ error: "Reject করা কাজে সেশন যোগ করা যাবে না" }, { status: 400 });
  job.sessions.push({ date, start, end, note, minutes: calcMinutes(start, end) });
  job.durationMinutes = sumMinutes(job.sessions);
  await job.save();
  return NextResponse.json(job);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const sid = new URL(req.url).searchParams.get("sid");
  const job: any = await Job.findById(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status === "delivered") return NextResponse.json({ error: "ডেলিভারি হয়ে যাওয়া কাজের সেশন মোছা যাবে না" }, { status: 400 });
  job.sessions.pull(sid);
  job.durationMinutes = sumMinutes(job.sessions);
  await job.save();
  return NextResponse.json(job);
}
