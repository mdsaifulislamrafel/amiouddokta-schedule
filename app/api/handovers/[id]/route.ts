import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Handover from "@/models/Handover";
import Collector from "@/models/Collector";
import Payment from "@/models/Payment";
import Client from "@/models/Client";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  void Collector; void Client;
  const h = await Handover.findById(params.id).populate("collector")
    .populate({ path: "payments", select: "receiptNo date amount method trxId label client", populate: { path: "client", select: "name phone" } }).lean();
  return h ? NextResponse.json(h) : NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
}

// অফিস টাকা বুঝে নিল (action=receive) — কে গ্রহণ করেছেন তার নাম লাগবে
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const b = await req.json();
  const h: any = await Handover.findById(params.id);
  if (!h) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  if (b.action === "receive") {
    if (!(b.receivedBy || "").trim()) return NextResponse.json({ error: "অফিসে কে টাকা বুঝে নিয়েছেন তার নাম দিন" }, { status: 400 });
    if (h.status === "received") return NextResponse.json({ error: "এটি আগেই গ্রহণ করা হয়েছে" }, { status: 400 });
    h.status = "received"; h.receivedBy = b.receivedBy.trim(); h.receivedAt = new Date();
    if (b.note) h.note = [h.note, b.note].filter(Boolean).join(" | ");
    await h.save();
    await Payment.updateMany({ handover: h._id }, { settle: "received" });
    return NextResponse.json(h);
  }
  return NextResponse.json({ error: "অজানা কাজ" }, { status: 400 });
}

// হ্যান্ডওভার বাতিল — রশিদগুলো আবার গ্রহণকারীর হাতে ফিরে যাবে
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const h: any = await Handover.findById(params.id);
  if (!h) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  await Payment.updateMany({ handover: h._id }, { settle: "holding", $unset: { handover: 1 } });
  await h.deleteOne();
  return NextResponse.json({ ok: true });
}
