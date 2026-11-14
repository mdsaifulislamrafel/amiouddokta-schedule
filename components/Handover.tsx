import { tk, handoverNo } from "@/lib/utils";

// অফিস টাকা বুঝে নেওয়ার কনফার্মেশন — কে গ্রহণ করছেন তার নাম মনে রাখে
export async function confirmReceive(h: any) {
  const last = localStorage.getItem("officeReceiver") || "";
  const name = prompt(`${handoverNo(h.handoverNo)} — ${tk(h.amount)}\nঅফিসে কে টাকা বুঝে নিচ্ছেন? (নাম লিখুন)`, last);
  if (!name?.trim()) return false;
  localStorage.setItem("officeReceiver", name.trim());
  const r = await fetch(`/api/handovers/${h._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "receive", receivedBy: name.trim() }) });
  if (!r.ok) { alert((await r.json()).error); return false; }
  return true;
}
