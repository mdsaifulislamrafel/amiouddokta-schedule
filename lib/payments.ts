import { randomBytes } from "crypto";
import Payment, { nextSeq } from "@/models/Payment";

export const newToken = () => randomBytes(12).toString("base64url");
// পুরোনো রশিদে লিংকের কোড না থাকলে বানিয়ে দেয়
export async function ensureTokens(list: any[]) {
  for (const p of list) if (!p.token) { p.token = newToken(); await Payment.updateOne({ _id: p._id }, { token: p.token }); }
  return list;
}
import Job from "@/models/Job";
import Client from "@/models/Client";

// পেমেন্ট যোগ/মোছার সময় কাজের paid বা প্যাকেজের paid আপডেট
export async function applyPayment(p: any, sign: 1 | -1) {
  const amt = sign * (p.amount || 0);
  if (p.kind === "job" && p.job) await Job.updateOne({ _id: p.job }, { $inc: { paid: amt } });
  if (p.kind === "package") await Client.updateOne({ _id: p.client }, { $inc: { "pkg.paid": amt } });
}

// নতুন রশিদ তৈরি; applyToTarget=false হলে শুধু রেকর্ড রাখে (যেমন কাজ তৈরির সময়ের অগ্রিম, যা আগেই paid এ আছে)
export async function createPayment(data: any, applyToTarget = true) {
  const p = await Payment.create({ ...data, receiptNo: await nextSeq("receipt"), token: newToken() });
  if (applyToTarget) await applyPayment(p, 1);
  return p;
}

export { PAY_METHODS as METHODS } from "@/lib/utils";

// রশিদে দেখানোর তথ্য (পাবলিক লিংকেও এটুকুই যায়)
export function receiptData(p: any) {
  const due = p.kind === "job" && p.job ? (p.job.charge || 0) - (p.job.paid || 0)
    : p.kind === "package" ? (p.client?.pkg?.price || 0) - (p.client?.pkg?.paid || 0) : null;
  return {
    _id: p._id, token: p.token, receiptNo: p.receiptNo, kind: p.kind, label: p.label, amount: p.amount, method: p.method,
    trxId: p.trxId, date: p.date, receivedBy: p.receivedBy, note: p.note, due,
    client: p.client ? { _id: p.client._id, name: p.client.name, phone: p.client.phone } : null,
  };
}
