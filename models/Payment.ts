import mongoose, { Schema } from "mongoose";

// রশিদ নাম্বার ধারাবাহিক রাখার জন্য কাউন্টার
const CounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter: any = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
export const nextSeq = async (name: string) => (await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, upsert: true })).seq as number;

// টাকা জমার রেকর্ড (মানি রিসিট)
const PaymentSchema = new Schema({
  receiptNo: { type: Number, unique: true },
  token: { type: String, unique: true, sparse: true },   // ক্লায়েন্টের জন্য পাবলিক লিংকের গোপন কোড
  client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  kind: { type: String, enum: ["job", "package", "other"], default: "job" }, // কাজের, প্যাকেজের নাকি অন্যান্য/অগ্রিম
  label: String,                                   // কিসের টাকা (সার্ভিস / প্যাকেজের নাম)
  amount: { type: Number, required: true },
  method: { type: String, default: "Cash" },
  trxId: String,                                   // বিকাশ/নগদ/ব্যাংকের ট্রানজেকশন আইডি
  date: { type: String, required: true },          // YYYY-MM-DD
  receivedBy: String,
  note: String,
}, { timestamps: true });

export default (mongoose.models.Payment || mongoose.model("Payment", PaymentSchema)) as any;
