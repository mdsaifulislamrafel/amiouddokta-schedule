import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Job from "@/models/Job";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const client = await Client.findById(params.id).lean();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const jobs: any[] = await Job.find({ client: params.id }).sort({ date: -1, startTime: -1 }).lean();
  const usage: Record<string, number> = {};   // প্যাকেজের মাসভিত্তিক ব্যবহৃত মিনিট
  const ledger: any[] = [];                   // সব সেশনের তালিকা
  let total = 0, extraCharge = 0, extraPaid = 0;
  jobs.forEach(j => {
    const ss = j.sessions?.length
      ? j.sessions.map((s: any) => ({ sid: String(s._id), date: s.date, start: s.start, end: s.end, minutes: s.minutes || 0, note: s.note }))
      : j.durationMinutes ? [{ sid: null, date: j.date, start: j.actualStart, end: j.actualEnd, minutes: j.durationMinutes, note: "" }] : [];
    ss.forEach((s: any) => {
      ledger.push({ ...s, jobId: String(j._id), serviceType: j.serviceType, usePackage: j.usePackage, locked: j.status === "delivered" });
      total += s.minutes;
      if (j.usePackage) usage[s.date.slice(0, 7)] = (usage[s.date.slice(0, 7)] || 0) + s.minutes;
    });
    if (!j.usePackage) { extraCharge += j.charge || 0; extraPaid += j.paid || 0; }
  });
  ledger.sort((a, b) => (b.date + (b.start || "")).localeCompare(a.date + (a.start || "")));
  return NextResponse.json({ client, jobs, usage, ledger, totalMinutes: total, extraCharge, extraPaid });
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  try { return NextResponse.json(await Client.findByIdAndUpdate(params.id, await req.json(), { new: true })); }
  catch (e: any) { return NextResponse.json({ error: e.code === 11000 ? "এই নাম্বার অন্য ক্লায়েন্টের" : e.message }, { status: 400 }); }
}
