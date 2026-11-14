import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Handover from "@/models/Handover";
import Collector from "@/models/Collector";
import Payment, { nextSeq } from "@/models/Payment";

export const dynamic = "force-dynamic";

// হ্যান্ডওভারের তালিকা (?status=submitted → অফিসের যাচাই বাকি, ?collectorId=...)
export async function GET(req: Request) {
  await connectDB();
  void Collector;
  const sp = new URL(req.url).searchParams;
  const q: any = {};
  if (sp.get("status")) q.status = sp.get("status");
  if (sp.get("collectorId")) q.collector = sp.get("collectorId");
  return NextResponse.json(await Handover.find(q).populate("collector", "name phone designation code").sort({ handoverNo: -1 }).limit(500).lean());
}

// গ্রহণকারী তার হাতে থাকা রশিদগুলো অফিসে বুঝিয়ে দিচ্ছে
// status=submitted → অফিস পরে যাচাই করে গ্রহণ করবে; status=received → সাথে সাথেই অফিস বুঝে নিয়েছে
export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();
  const ids: string[] = Array.isArray(b.paymentIds) ? b.paymentIds : [];
  if (!b.collectorId || !ids.length) return NextResponse.json({ error: "কমপক্ষে একটি রশিদ বাছাই করুন" }, { status: 400 });
  const status = b.status === "received" ? "received" : "submitted";
  if (status === "received" && !(b.receivedBy || "").trim()) return NextResponse.json({ error: "অফিসে কে টাকা বুঝে নিয়েছেন তার নাম দিন" }, { status: 400 });
  const pays: any[] = await Payment.find({ _id: { $in: ids }, collector: b.collectorId, settle: "holding" }).select("amount").lean();
  if (pays.length !== ids.length) return NextResponse.json({ error: "কিছু রশিদ আগেই অফিসে দেওয়া হয়েছে বা এই ব্যক্তির নয়। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।" }, { status: 400 });
  const h = await Handover.create({
    handoverNo: await nextSeq("handover"), collector: b.collectorId, payments: ids, amount: pays.reduce((a, p) => a + (p.amount || 0), 0),
    method: b.method || "Cash", trxId: b.trxId, status, date: b.date || new Date().toLocaleDateString("en-CA"), note: b.note,
    ...(status === "received" && { receivedBy: b.receivedBy.trim(), receivedAt: new Date() }),
  });
  await Payment.updateMany({ _id: { $in: ids }, settle: "holding" }, { settle: status, handover: h._id });
  return NextResponse.json(h);
}
