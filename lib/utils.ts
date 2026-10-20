export const SERVICES = ["Class Recording","Fashion Shoot","Podcast","Content","Promotional Video","Content Shoot & Edit","Ads","Review Video","Interview","Travel Shoot","Saree Shoot"];
export const STATUS_LABEL: Record<string, string> = {
  pending: "Approval অপেক্ষায়", approved: "Approved", completed: "শুট শেষ (ডেলিভারি বাকি)", delivered: "Delivered", rejected: "Rejected",
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
