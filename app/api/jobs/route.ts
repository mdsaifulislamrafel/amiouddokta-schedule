import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import Job from "@/models/Job";

export const FIELDS = ["serviceType","title","date","startTime","endTime","assignedTo","location","charge","paid","usePackage","expectedDeliveryDate","deliveryEstimate","deliveryPhone","driveLinks","deliveryNote","optionalNote"];

export async function GET(req: Request) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q: any = {};
  ["status", "serviceType"].forEach(k => sp.get(k) && (q[k] = sp.get(k)));
  if (sp.get("clientId")) q.client = sp.get("clientId");
  if (sp.get("from") || sp.get("to")) q.date = { ...(sp.get("from") && { $gte: sp.get("from") }), ...(sp.get("to") && { $lte: sp.get("to") }) };
  return NextResponse.json(await Job.find(q).populate("client", "name phone isMember").sort({ date: -1, startTime: -1 }).limit(500).lean());
}

export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();
  let clientId = b.clientId;
  if (!clientId) {
    if (!b.newName || !b.newPhone) return NextResponse.json({ error: "ক্লায়েন্টের নাম ও নাম্বার দিন" }, { status: 400 });
    const c: any = (await Client.findOne({ phone: b.newPhone })) || (await Client.create({ name: b.newName, phone: b.newPhone }));
    clientId = c._id;
  }
  const data: any = { client: clientId };
  FIELDS.forEach(k => b[k] !== undefined && (data[k] = b[k]));
  return NextResponse.json(await Job.create(data));
}
