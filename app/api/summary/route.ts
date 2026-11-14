import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Job from "@/models/Job";
import Client from "@/models/Client";

export const dynamic = "force-dynamic";

// অ্যাডমিন সারসংক্ষেপ (লগইন লাগবে) — কালেকশন, বকেয়া, প্যাকেজের মেয়াদ
export async function GET() {
  await connectDB();
  const tz = process.env.APP_TZ || "Asia/Dhaka";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const month = today.slice(0, 7);
  const in7 = new Date(Date.now() + 7 * 864e5).toLocaleDateString("en-CA", { timeZone: tz });
  const [todayP, monthP, jobs, members, unsettled] = await Promise.all([
    Payment.find({ date: today }).select("amount").lean(),
    Payment.find({ date: { $gte: month + "-01", $lte: month + "-31" } }).select("amount method").lean(),
    Job.find({ status: { $ne: "rejected" }, $nor: [{ usePackage: true, deductFrom: "money" }] }).select("charge paid").lean(),
    Client.find({ isMember: true }).select("name phone pkg").lean(),
    Payment.find({ settle: { $in: ["holding", "submitted"] } }).select("amount settle").lean(),
  ]);
  const sum = (a: any[]) => a.reduce((s, x) => s + (x.amount || 0), 0);
  const byMethod: Record<string, number> = {};
  (monthP as any[]).forEach(p => (byMethod[p.method] = (byMethod[p.method] || 0) + p.amount));
  const jobDue = (jobs as any[]).reduce((s, j) => s + Math.max(0, (j.charge || 0) - (j.paid || 0)), 0);
  const pkgDue = (members as any[]).reduce((s, c) => s + Math.max(0, (c.pkg?.price || 0) - (c.pkg?.paid || 0)), 0);
  const expiring = (members as any[]).filter(c => c.pkg?.endDate && c.pkg.endDate <= in7)
    .map(c => ({ _id: c._id, name: c.name, phone: c.phone, pkg: c.pkg.name, endDate: c.pkg.endDate, expired: c.pkg.endDate < today }))
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  const inHand = sum((unsettled as any[]).filter(p => p.settle === "holding"));
  const pendingVerify = sum((unsettled as any[]).filter(p => p.settle === "submitted"));
  return NextResponse.json({ today, todayTotal: sum(todayP), monthTotal: sum(monthP), byMethod, totalDue: jobDue + pkgDue, expiring, inHand, pendingVerify });
}
