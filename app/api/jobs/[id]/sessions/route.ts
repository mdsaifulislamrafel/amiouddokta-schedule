import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import { calcMinutes, sumMinutes } from "@/lib/utils";

// নতুন শুটিং সেশন যোগ (একই কাজে একাধিক দিনের সময় জমা হবে)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const { date, start, end, note, minutes } = await req.json();
  // শুরু-শেষ সময় দিলে নিজে হিসাব হবে, না হলে সরাসরি মিনিট (এডিটের কাজে কাজে লাগে)
  const m = start && end ? calcMinutes(start, end) : Number(minutes) || 0;
  if (!date || m <= 0) return NextResponse.json({ error: "তারিখ এবং শুরু ও শেষের সময় (অথবা মোট সময়) দিন" }, { status: 400 });
  const job: any = await Job.findById(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.status === "rejected") return NextResponse.json({ error: "Reject করা কাজে সেশন যোগ করা যাবে না" }, { status: 400 });
  job.sessions.push({ date, start: start && end ? start : undefined, end: start && end ? end : undefined, note, minutes: m });
  job.durationMinutes = sumMinutes(job.sessions);
  await job.save();
  return NextResponse.json(job);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const sid = new URL(req.url).searchParams.get("sid");
  const job: any = await Job.findById(params.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  job.sessions.pull(sid);
  job.durationMinutes = sumMinutes(job.sessions);
  await job.save();
  return NextResponse.json(job);
}
