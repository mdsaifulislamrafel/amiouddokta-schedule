import mongoose, { Schema } from "mongoose";

const ClientSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  altPhones: [String],
  isMember: { type: Boolean, default: false },
  pkg: {
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    name: String, serviceType: String,
    price: Number, paid: Number,
    monthlyHours: Number,                            // প্যাকেজের ঘন্টা (hoursPeriod অনুযায়ী মাসে বা মোট)
    hoursPeriod: { type: String, enum: ["month", "total"], default: "month" },
    credit: Number,                                  // টাকার ব্যালেন্স (অন্য কাজের চার্জ এখান থেকে কাটা যাবে)
    startDate: String, endDate: String,
    features: [String], terms: [String],
  },
  notes: String,
}, { timestamps: true });

export default (mongoose.models.Client || mongoose.model("Client", ClientSchema)) as any;
