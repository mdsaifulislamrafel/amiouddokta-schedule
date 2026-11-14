import mongoose, { Schema } from "mongoose";

// গ্রহণকারী ব্যক্তি অফিসে টাকা বুঝিয়ে দেওয়ার রেকর্ড (হ্যান্ডওভার স্লিপ)
const HandoverSchema = new Schema({
  handoverNo: { type: Number, unique: true },
  collector: { type: Schema.Types.ObjectId, ref: "Collector", required: true },
  payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  amount: { type: Number, required: true },
  method: { type: String, default: "Cash" },       // কিভাবে অফিসে দিয়েছে (ক্যাশ / ব্যাংক / বিকাশ)
  trxId: String,
  status: { type: String, enum: ["submitted", "received"], default: "submitted" }, // জমা দিয়েছে (যাচাই বাকি) / অফিস গ্রহণ করেছে
  date: { type: String, required: true },          // হ্যান্ডওভারের তারিখ YYYY-MM-DD
  receivedBy: String,                              // অফিসে কে বুঝে নিয়েছে
  receivedAt: Date,
  note: String,
}, { timestamps: true });

export default (mongoose.models.Handover || mongoose.model("Handover", HandoverSchema)) as any;
