import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Collector from "@/models/Collector";
import Payment from "@/models/Payment";
import Handover from "@/models/Handover";
import Client from "@/models/Client";
import { collectorStats, emptyStats } from "@/lib/collectors";

export const dynamic = "force-dynamic";

// একজন গ্রহণকারীর পুরো খাতা: তথ্য, হিসাব, কোন ক্লায়েন্ট কত দিয়েছে, অফিসে বুঝিয়ে দেওয়ার ইতিহাস
export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  void Client;
  const c: any = await Collector.findById(params.id).lean();
  if (!c) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  const [stats, payments, handovers] = await Promise.all([
    collectorStats([params.id]),
    Payment.find({ collector: params.id }).populate("client", "name phone").sort({ date: -1, receiptNo: -1 }).lean(),
    Handover.find({ collector: params.id }).sort({ handoverNo: -1 }).lean(),
  ]);
  return NextResponse.json({ collector: { ...c, stats: stats[params.id] || emptyStats() }, payments, handovers });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const b = await req.json();
  const upd: any = {};
  ["name", "phone", "designation", "note"].forEach(k => b[k] !== undefined && (upd[k] = String(b[k]).trim()));
  if (b.limit !== undefined) upd.limit = Number(b.limit) || 0;
  if (b.active !== undefined) upd.active = !!b.active;
  if (upd.name === "" || upd.phone === "" || upd.designation === "") return NextResponse.json({ error: "নাম, ফোন নাম্বার ও পদবি খালি রাখা যাবে না" }, { status: 400 });
  if (upd.phone && await Collector.exists({ phone: upd.phone, _id: { $ne: params.id } })) return NextResponse.json({ error: "এই ফোন নাম্বারে আগেই একজন গ্রহণকারী আছেন" }, { status: 400 });
  const c = await Collector.findByIdAndUpdate(params.id, upd, { new: true });
  return c ? NextResponse.json(c) : NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
}

// টাকা নেওয়ার রেকর্ড থাকলে মোছা যাবে না (হিসাব নষ্ট হবে) — তখন বন্ধ করে দিন
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  if (await Payment.exists({ collector: params.id })) return NextResponse.json({ error: "এই ব্যক্তির কাছে টাকা জমার রেকর্ড আছে, তাই মোছা যাবে না। এডিট করে 'বন্ধ' করে দিন।" }, { status: 400 });
  await Collector.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
