import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/") return NextResponse.next(); // পাবলিক ড্যাশবোর্ড
  const t = req.cookies.get("sid")?.value;
  if (t) {
    try { await jwtVerify(t, new TextEncoder().encode(process.env.JWT_SECRET!)); return NextResponse.next(); } catch {}
  }
  if (req.nextUrl.pathname.startsWith("/api")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/((?!login|api/auth|api/dashboard|api/r/|r/|_next|favicon.ico|logo.jpg|watermark.png).*)"] };
