import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import { signToken } from "@/lib/auth";

const AdminModel: any = Admin;

export async function POST(req: Request) {
  const { username, password } = await req.json();
  await connectDB();
  if ((await AdminModel.countDocuments()) === 0 && process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) {
    await AdminModel.create({ username: process.env.ADMIN_USER, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
  }
  const a: any = await AdminModel.findOne({ username });
  if (!a || !(await bcrypt.compare(password || "", a.passwordHash))) return NextResponse.json({ error: "ইউজারনেম বা পাসওয়ার্ড ভুল" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sid", await signToken(username), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 604800, secure: process.env.NODE_ENV === "production" });
  return res;
}