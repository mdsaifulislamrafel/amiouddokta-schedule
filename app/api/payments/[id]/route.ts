import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Job from "@/models/Job";
import Client from "@/models/Client";
import { applyPayment, ensureTokens, receiptData } from "@/lib/payments";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  void Job; void Client;
  const p: any = await Payment.findById(params.id).populate("client").populate("job").lean();
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
  const p = await Payment.findByIdAndUpdate(params.id, upd, { new: true });
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const p: any = await Payment.findById(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await applyPayment(p, -1);
  await p.deleteOne();
  return NextResponse.json({ ok: true });
}
