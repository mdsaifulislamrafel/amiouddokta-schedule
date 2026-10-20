import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";

export async function GET(req: Request) {
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const q: any = {};
  if (sp.get("member") === "1") q.isMember = true;
  const s = sp.get("q");
  if (s) q.$or = [{ name: new RegExp(s, "i") }, { phone: new RegExp(s) }, { altPhones: new RegExp(s) }];
  return NextResponse.json(await Client.find(q).sort({ name: 1 }).lean());
}

export async function POST(req: Request) {
  await connectDB();
  try { return NextResponse.json(await Client.create(await req.json())); }
  catch (e: any) { return NextResponse.json({ error: e.code === 11000 ? "এই নাম্বারে ক্লায়েন্ট আগে থেকেই আছে" : e.message }, { status: 400 }); }
}