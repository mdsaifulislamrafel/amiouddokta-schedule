import mongoose from "mongoose";
import Payment from "@/models/Payment";

export const emptyStats = () => ({ total: 0, count: 0, holding: 0, submitted: 0, received: 0, monthTotal: 0, lastDate: "" });

// প্রত্যেক গ্রহণকারীর হিসাব: মোট সংগ্রহ, হাতে আছে, যাচাই বাকি, অফিস বুঝে নিয়েছে
export async function collectorStats(ids?: string[]) {
  const tz = process.env.APP_TZ || "Asia/Dhaka";
  const month = new Date().toLocaleDateString("en-CA", { timeZone: tz }).slice(0, 7);
  const match: any = { collector: ids ? { $in: ids.map(i => new mongoose.Types.ObjectId(i)) } : { $ne: null } };
  const rows = await Payment.aggregate([
    { $match: match },
    { $group: {
      _id: "$collector", total: { $sum: "$amount" }, count: { $sum: 1 }, lastDate: { $max: "$date" },
      holding: { $sum: { $cond: [{ $eq: ["$settle", "submitted"] }, 0, { $cond: [{ $eq: ["$settle", "received"] }, 0, "$amount"] }] } },
      submitted: { $sum: { $cond: [{ $eq: ["$settle", "submitted"] }, "$amount", 0] } },
      received: { $sum: { $cond: [{ $eq: ["$settle", "received"] }, "$amount", 0] } },
      monthTotal: { $sum: { $cond: [{ $eq: [{ $substrCP: ["$date", 0, 7] }, month] }, "$amount", 0] } },
    } },
  ]);
  const map: Record<string, any> = {};
  rows.forEach((r: any) => (map[String(r._id)] = { ...emptyStats(), ...r, _id: undefined }));
  return map;
}
