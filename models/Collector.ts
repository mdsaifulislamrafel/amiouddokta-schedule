import mongoose, { Schema } from "mongoose";

// টাকা গ্রহণকারী ব্যক্তি (CEO, COO, GM...) — ক্লায়েন্ট এদের কাছে টাকা জমা দেয়, এরা পরে অফিসে বুঝিয়ে দেয়
const CollectorSchema = new Schema({
  code: { type: Number, unique: true },            // ইউনিক আইডি (RC-001)
  name: { type: String, required: true },
  phone: { type: String, required: true },
  designation: { type: String, required: true },   // কোম্পানিতে দায়িত্ব: CEO, COO, GM ...
  limit: { type: Number, default: 0 },             // হাতে সর্বোচ্চ কত টাকা রাখতে পারবে (0 = সীমা নেই)
  note: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default (mongoose.models.Collector || mongoose.model("Collector", CollectorSchema)) as any;
