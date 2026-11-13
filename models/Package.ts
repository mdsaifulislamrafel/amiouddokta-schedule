import mongoose, { Schema } from "mongoose";

// ডাইনামিক প্যাকেজ টেমপ্লেট — এখান থেকে ক্লায়েন্টকে প্যাকেজ দেওয়া হয়
const PackageSchema = new Schema({
  name: { type: String, required: true },          // যেমন: Premium Class Recording
  serviceType: String,                             // কোন সার্ভিসের প্যাকেজ
  price: { type: Number, default: 0 },             // প্যাকেজ মূল্য (টাকা)
  hours: { type: Number, default: 0 },             // কত ঘন্টা কাজ পাবে
  hoursPeriod: { type: String, enum: ["month", "total"], default: "month" }, // প্রতি মাসে নাকি পুরো মেয়াদে
  credit: { type: Number, default: 0 },            // অন্য কাজে খরচ করা যাবে এমন টাকার ব্যালেন্স
  durationMonths: { type: Number, default: 1 },    // মেয়াদ (মাস)
  features: [String],                              // কী কী সুবিধা পাবে
  terms: [String],                                 // এগ্রিমেন্টের শর্ত
  note: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default (mongoose.models.Package || mongoose.model("Package", PackageSchema)) as any;
