import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";

export async function GET(req: Request) {
  await connectDB();
  const q: any = new URL(req.url).searchParams.get("active") === "1" ? { active: true } : {};
  return NextResponse.json(await Package.find(q).sort({ active: -1, name: 1 }).lean());
}

export async function POST(req: Request) {
  await connectDB();
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "প্যাকেজের নাম দিন" }, { status: 400 });
  delete b._id;
  return NextResponse.json(await Package.create(b));
}
