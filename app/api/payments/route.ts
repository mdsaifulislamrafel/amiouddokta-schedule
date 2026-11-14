import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Job from "@/models/Job";
import Client from "@/models/Client";
import { createPayment, ensureTokens } from "@/lib/payments";

export async function GET(req: Request) {
  await connectDB();
  void Client; void Job;
  const sp = new URL(req.url).searchParams;
  const q: any = {};
  if (sp.get("clientId")) q.client = sp.get("clientId");
  if (sp.get("jobId")) q.job = sp.get("jobId");
  if (sp.get("method")) q.method = sp.get("method");
  if (sp.get("kind")) q.kind = sp.get("kind");
  if (sp.get("from") || sp.get("to")) q.date = { ...(sp.get("from") && { $gte: sp.get("from") }), ...(sp.get("to") && { $lte: sp.get("to") }) };
  const list = await Payment.find(q).populate("client", "name phone").populate("job", "serviceType title jobType date").sort({ date: -1, receiptNo: -1 }).limit(1000).lean();
  return NextResponse.json(await ensureTokens(list));
}

export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();
  const amount = Number(b.amount);
  if (!b.clientId) return NextResponse.json({ error: "ক্লায়েন্ট বাছাই করুন" }, { status: 400 });
  if (!(amount > 0)) return NextResponse.json({ error: "সঠিক টাকার পরিমাণ দিন" }, { status: 400 });
  const client: any = await Client.findById(b.clientId).lean();
  if (!client) return NextResponse.json({ error: "ক্লায়েন্ট পাওয়া যায়নি" }, { status: 404 });
  let label = b.label || "";
  if (b.kind === "job") {
    const job: any = await Job.findOne({ _id: b.jobId, client: b.clientId }).lean();
    if (!job) return NextResponse.json({ error: "কাজ পাওয়া যায়নি" }, { status: 404 });
    label = `${job.serviceType}${job.title ? " — " + job.title : ""} (${job.date})`;
  } else if (b.kind === "package") {
    if (!client.pkg?.name) return NextResponse.json({ error: "এই ক্লায়েন্টের কোনো প্যাকেজ নেই" }, { status: 400 });
    label = `Package: ${client.pkg.name}`;
  } else label = label || "Advance / Other";
  const p = await createPayment({
    client: b.clientId, job: b.kind === "job" ? b.jobId : undefined, kind: b.kind || "other", label, amount,
    method: b.method || "Cash", trxId: b.trxId, date: b.date || new Date().toLocaleDateString("en-CA"), receivedBy: b.receivedBy, note: b.note,
  });
  return NextResponse.json(p);
}
