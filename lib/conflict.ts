import Job from "@/models/Job";
import Client from "@/models/Client";
import { fmt12 } from "@/lib/utils";

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

// একই তারিখে সময় মিলে যায় এমন অন্য কাজ থাকলে সেটা ফেরত দেয়, না থাকলে null
export async function findConflict(date?: string, startTime?: string, endTime?: string, excludeId?: string) {
  if (!date || !startTime || !endTime) return null;
  void Client; // populate এর জন্য মডেল রেজিস্টার
  const s = toMin(startTime);
  let e = toMin(endTime);
  if (e <= s) e += 1440; // রাত পেরিয়ে গেলে

  const q: any = { date, status: { $ne: "rejected" }, startTime: { $nin: [null, ""] }, endTime: { $nin: [null, ""] } };
  if (excludeId) q._id = { $ne: excludeId };

  const jobs: any[] = await Job.find(q).populate("client", "name").lean();
  for (const j of jobs) {
    const js = toMin(j.startTime);
    let je = toMin(j.endTime);
    if (je <= js) je += 1440;
    if (s < je && js < e) return j; // ওভারল্যাপ
  }
  return null;
}

export function conflictMessage(j: any) {
  return `এই সময়ে আগে থেকেই ${j.client?.name || "অন্য ক্লায়েন্টের"} কাজ আছে (${j.date}, ${fmt12(j.startTime)} - ${fmt12(j.endTime)})। অন্য সময় বাছাই করুন।`;
}