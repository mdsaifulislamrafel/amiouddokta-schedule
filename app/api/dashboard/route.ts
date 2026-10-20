import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import Client from "@/models/Client";

export const dynamic = "force-dynamic";
// পাবলিক ড্যাশবোর্ডে ক্লায়েন্টের ফোন নাম্বার দেখাতে চাইলে true করুন
const SHOW_PHONE = false;

export async function GET() {
  await connectDB();
  void Client; // populate এর জন্য মডেল রেজিস্টার
  const today = new Date().toLocaleDateString("en-CA", { timeZone: process.env.APP_TZ || "Asia/Dhaka" }); // YYYY-MM-DD
  const pop = { path: "client", select: SHOW_PHONE ? "name phone isMember" : "name isMember" };
  const sel = "serviceType title date startTime endTime assignedTo status durationMinutes client";

  const [upcoming, pending, toDeliver, overdue, todayCount] = await Promise.all([
    Job.find({ date: { $gte: today }, status: { $ne: "rejected" } }).select(sel).populate(pop).sort({ date: 1, startTime: 1 }).limit(200).lean(),
    Job.find({ status: "pending" }).select(sel).populate(pop).sort({ date: 1, startTime: 1 }).limit(100).lean(),
    Job.find({ status: "completed" }).select(sel).populate(pop).sort({ date: 1 }).limit(100).lean(),
    Job.find({ date: { $lt: today }, status: { $in: ["pending", "approved"] } }).select(sel).populate(pop).sort({ date: -1 }).limit(100).lean(),
    Job.countDocuments({ date: today, status: { $ne: "rejected" } }),
  ]);
  return NextResponse.json({ today, todayCount, upcoming, pending, toDeliver, overdue });
}
