import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
export async function GET() {
  const t = cookies().get("sid")?.value;
  try { await jwtVerify(t || "", new TextEncoder().encode(process.env.JWT_SECRET!)); return NextResponse.json({ admin: true }); }
  catch { return NextResponse.json({ admin: false }); }
}
