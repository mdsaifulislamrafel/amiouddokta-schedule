import Package from "@/models/Package";
import Client from "@/models/Client";
import { addMonths } from "@/lib/utils";

// টেমপ্লেট থেকে ক্লায়েন্টকে প্যাকেজ দেওয়া। একই প্যাকেজ চালু থাকলে কিছু বদলায় না
export async function assignPackage(clientId: any, packageId: string, startDate?: string) {
  const t: any = await Package.findById(packageId).lean();
  if (!t) return null;
  const c: any = await Client.findById(clientId);
  if (!c) return null;
  const today = new Date().toLocaleDateString("en-CA");
  const active = c.isMember && String(c.pkg?.packageId || "") === String(t._id) && (!c.pkg?.endDate || c.pkg.endDate >= today);
  if (!active) {
    const start = startDate || today;
    c.isMember = true;
    c.pkg = {
      packageId: t._id, name: t.name, serviceType: t.serviceType, price: t.price || 0, paid: 0,
      monthlyHours: t.hours || 0, hoursPeriod: t.hoursPeriod || "month", credit: t.credit || 0,
      startDate: start, endDate: addMonths(start, t.durationMonths || 1), features: t.features || [], terms: t.terms || [],
    };
    await c.save();
  }
  return t;
}
