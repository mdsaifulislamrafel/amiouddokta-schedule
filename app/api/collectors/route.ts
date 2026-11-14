import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Collector from "@/models/Collector";
import { nextSeq } from "@/models/Payment";
import { collectorStats, emptyStats } from "@/lib/collectors";

export const dynamic = "force-dynamic";

// সব টাকা গ্রহণকারী + প্রত্যেকের আলাদা হিসাব (?active=1 দিলে শুধু চালু থাকা)
export async function GET(req: Request) {
  await connectDB();
  const q: any = new URL(req.url).searchParams.get("active") === "1" ? { active: true } : {};
  const list = await Collector.find(q).sort({ active: -1, code: 1 }).lean();
  const stats = await collectorStats();
  return NextResponse.json(list.map((c: any) => ({ ...c, stats: stats[String(c._id)] || emptyStats() })));
}

export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();
  const name = (b.name || "").trim(), phone = (b.phone || "").trim(), designation = (b.designation || "").trim();
  if (!name || !phone || !designation) return NextResponse.json({ error: "নাম, ফোন নাম্বার ও পদবি দিন" }, { status: 400 });
  if (await Collector.exists({ phone })) return NextResponse.json({ error: "এই ফোন নাম্বারে আগেই একজন গ্রহণকারী আছেন" }, { status: 400 });
  const c = await Collector.create({ name, phone, designation, limit: Number(b.limit) || 0, note: b.note, active: b.active !== false, code: await nextSeq("collector") });
  return NextResponse.json(c);
}
