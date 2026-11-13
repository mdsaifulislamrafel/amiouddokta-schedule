import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const p = await Package.findById(params.id).lean();
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const b = await req.json();
  delete b._id;
  const p = await Package.findByIdAndUpdate(params.id, b, { new: true, runValidators: true });
  return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

// প্যাকেজ টেমপ্লেট মুছলেও যেসব ক্লায়েন্টকে আগে দেওয়া হয়েছে তাদের কপি থেকে যাবে
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  await Package.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
