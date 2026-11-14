import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Job from "@/models/Job";
import Client from "@/models/Client";
import { receiptData } from "@/lib/payments";

export const dynamic = "force-dynamic";

// পাবলিক রশিদ — লগইন ছাড়া, শুধু গোপন কোড দিয়ে
export async function GET(_: Request, { params }: { params: { token: string } }) {
  await connectDB();
  void Job; void Client;
  if (!params.token || params.token.length < 12) return NextResponse.json({ error: "রশিদ পাওয়া যায়নি" }, { status: 404 });
  const p: any = await Payment.findOne({ token: params.token }).populate("client", "name phone pkg").populate("job", "charge paid").lean();
  if (!p) return NextResponse.json({ error: "রশিদ পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(receiptData(p), { headers: { "Cache-Control": "no-store" } });
}
