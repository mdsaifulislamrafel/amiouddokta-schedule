import mongoose, { Schema } from "mongoose";

const ClientSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  altPhones: [String],
  isMember: { type: Boolean, default: false },
  pkg: { name: String, price: Number, monthlyHours: Number, startDate: String, endDate: String },
  notes: String,
}, { timestamps: true });

export default (mongoose.models.Client || mongoose.model("Client", ClientSchema)) as any;