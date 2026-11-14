import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Job from "@/models/Job";
import Client from "@/models/Client";
import Collector from "@/models/Collector";
import { applyPayment, ensureTokens, receiptData } from "@/lib/payments";
import { collectorLabel } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  void Job; void Client; void Collector;
  const p: any = await Payment.findById(params.id).populate("client").populate("job").populate("collector", "name phone designation code").lean();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await ensureTokens([p]);
  return NextResponse.json(receiptData(p));
}

// শুধু নোট/মাধ্যম/তারিখ বদলানো যাবে; টাকার পরিমাণ ভুল হলে রশিদ মুছে নতুন দিন
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const b = await req.json();
  const upd: any = {};
  ["method", "trxId", "date", "receivedBy", "note"].forEach(k => b[k] !== undefined && (upd[k] = b[k]));
  // গ্রহণকারী বদলানো যাবে শুধু অফিসে দেওয়ার আগে
  if (b.collectorId !== undefined) {
    const cur: any = await Payment.findById(params.id).select("settle").lean();
    if (cur?.settle && cur.settle !== "holding") return NextResponse.json({ error: "এই টাকা অফিসে দেওয়া হয়ে গেছে, গ্রহণকারী বদলানো যাবে না" }, { status: 400 });
    if (b.collectorId) {
      const c: any = await Collector.findById(b.collectorId).lean();
      if (!c) return NextResponse.json({ error: "টাকা গ্রহণকারী পাওয়া যায়নি" }, { status: 404 });
      Object.assign(upd, { collector: c._id, settle: "holding", receivedBy: collectorLabel(c) });
    } else Object.assign(upd, { $unset: { collector: 1, settle: 1 } });
  }
  const p = await Payment.findByIdAndUpdate(params.id, upd, { new: true });
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const p: any = await Payment.findById(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (p.handover) return NextResponse.json({ error: "এই রশিদ একটি হ্যান্ডওভারে (অফিসে বুঝিয়ে দেওয়া) আছে। আগে গ্রহণকারীর পেজ থেকে হ্যান্ডওভারটি বাতিল করুন।" }, { status: 400 });
  await applyPayment(p, -1);
  await p.deleteOne();
  return NextResponse.json({ ok: true });
}
