export const SERVICES = ["Class Recording","Fashion Shoot","Podcast","Content","Promotional Video","Content Shoot & Edit","Ads","Review Video","Interview","Travel Shoot","Saree Shoot"];
export const EDIT_SERVICES = ["Video Editing","Class Video Edit","Podcast Edit","Reels / Short Edit","Promotional Video Edit","Ads Edit","Color Grading","Thumbnail Design"];
export const JOB_TYPE_LABEL: Record<string, string> = { shoot: "শুটিং", edit: "শুধু এডিট" };
export const FOOTAGE_SOURCE: Record<string, string> = { client_self: "ক্লায়েন্ট নিজে শুট করেছে", other_studio: "অন্য জায়গায় শুট করা" };
export const STATUS_LABEL: Record<string, string> = {
  pending: "Approval অপেক্ষায়", approved: "Approved", completed: "শুট শেষ (ডেলিভারি বাকি)", delivered: "Delivered", rejected: "Rejected",
};
const EDIT_STATUS_LABEL: Record<string, string> = { ...STATUS_LABEL, approved: "এডিট চলছে", completed: "এডিট শেষ (ডেলিভারি বাকি)" };
export const statusLabel = (status: string, jobType?: string) => (jobType === "edit" ? EDIT_STATUS_LABEL : STATUS_LABEL)[status] || status;
// প্যাকেজের কোন জায়গা থেকে কাটা হচ্ছে তার লেবেল
export const billingLabel = (j: any) => !j.usePackage ? "এক্সট্রা" : j.deductFrom === "money" ? "প্যাকেজ (টাকা)" : "প্যাকেজ (ঘন্টা)";
export const addMonths = (d: string, n: number) => {
  const x = new Date(d + "T00:00:00"); x.setMonth(x.getMonth() + n); x.setDate(x.getDate() - 1);
  return x.toLocaleDateString("en-CA");
};
export function calcMinutes(s?: string, e?: string): number | null {
  if (!s || !e) return null;
  const [a, b] = s.split(":").map(Number); const [c, d] = e.split(":").map(Number);
  let m = c * 60 + d - (a * 60 + b);
  if (m < 0) m += 1440; // রাত 12টা পার হলে
  return m;
}
export const sumMinutes = (s: any[] = []) => s.reduce((a, x) => a + (x.minutes || 0), 0);
export function fmtDur(m?: number | null) {
  if (m == null) return "-";
  return `${Math.floor(m / 60)} ঘন্টা ${m % 60} মিনিট`;
}
export function fmt12(t?: string) {
  if (!t) return "-";
  let [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
// ক্লায়েন্ট API (/api/clients/[id]) এর ডেটা থেকে প্যাকেজের ঘন্টা ও টাকার হিসাব
export function pkgSummary(d: any, month: string) {
  const p = d?.client?.pkg || {};
  const allowed = (p.monthlyHours || 0) * 60;
  const total = p.hoursPeriod === "total";
  const used = total ? d?.periodMinutes || 0 : d?.usage?.[month] || 0;
  const credit = p.credit || 0, moneyUsed = d?.moneyUsed || 0;
  return { allowed, used, left: Math.max(0, allowed - used), over: allowed > 0 && used > allowed ? used - allowed : 0, total, credit, moneyUsed, moneyLeft: credit - moneyUsed, periodText: total ? "পুরো মেয়াদে" : `${month} মাসে` };
}
export const tk = (n?: number) => "৳" + Math.round(n || 0).toLocaleString("en-IN");
export const receiptNo = (n?: number) => "MR-" + String(n || 0).padStart(5, "0");
// WhatsApp এ মেসেজ পাঠানোর লিংক (বাংলাদেশি নাম্বার 01XXXXXXXXX → 8801XXXXXXXXX)
export function waLink(phone: string | undefined, text: string) {
  let n = (phone || "").replace(/\D/g, "");
  if (n.startsWith("0")) n = "88" + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
export const PAY_METHODS = ["Cash", "bKash", "Nagad", "Rocket", "Bank", "Card"];
export const DESIGNATIONS = ["CEO", "COO", "CFO", "MD", "GM", "AGM", "Manager", "Accountant", "Executive"];
export const collectorCode = (n?: number) => "RC-" + String(n || 0).padStart(3, "0");
export const handoverNo = (n?: number) => "HO-" + String(n || 0).padStart(5, "0");
export const SETTLE_LABEL: Record<string, string> = { holding: "গ্রহণকারীর হাতে", submitted: "অফিসে দিয়েছে (যাচাই বাকি)", received: "অফিস বুঝে নিয়েছে" };
export const collectorLabel = (c: any) => c ? `${c.name} (${c.designation})` : "";
