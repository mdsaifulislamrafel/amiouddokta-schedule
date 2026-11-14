import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Job from "@/models/Job";
import Client from "@/models/Client";

export const dynamic = "force-dynamic";

// বকেয়া তালিকা: কাজের বকেয়া + প্যাকেজের বকেয়া। clientId দিলে ওই ক্লায়েন্টের সব কাজ (টাকা নেওয়ার জন্য)
export async function GET(req: Request) {
  await connectDB();
  const clientId = new URL(req.url).searchParams.get("clientId");
  const q: any = { status: { $ne: "rejected" }, $nor: [{ usePackage: true, deductFrom: "money" }] };
  if (clientId) q.client = clientId;
  const jobs: any[] = await Job.find(q).select("client jobType serviceType title date status charge paid usePackage deductFrom")
    .populate("client", "name phone").sort({ date: -1 }).limit(clientId ? 200 : 2000).lean();
  const jobDues = jobs.map(j => ({ ...j, due: (j.charge || 0) - (j.paid || 0) })).filter(j => clientId || j.due > 0);
  const cq: any = { isMember: true, "pkg.price": { $gt: 0 } };
  if (clientId) cq._id = clientId;
  const clients: any[] = await Client.find(cq).select("name phone pkg").lean();
  const pkgDues = clients.map(c => ({ client: { _id: c._id, name: c.name, phone: c.phone }, name: c.pkg.name, price: c.pkg.price || 0, paid: c.pkg.paid || 0, due: (c.pkg.price || 0) - (c.pkg.paid || 0), endDate: c.pkg.endDate }))
    .filter(p => clientId || p.due > 0);
  const total = jobDues.reduce((a, j) => a + Math.max(0, j.due), 0) + pkgDues.reduce((a, p) => a + Math.max(0, p.due), 0);
  return NextResponse.json({ jobs: jobDues, packages: pkgDues, total });
}
