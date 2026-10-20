import mongoose, { Schema } from "mongoose";
const SessionSchema = new Schema({
  date: { type: String, required: true },      // YYYY-MM-DD
  start: { type: String, required: true },     // HH:mm
  end: { type: String, required: true },
  minutes: { type: Number, default: 0 },
  note: String,
});
const JobSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  serviceType: { type: String, required: true },
  title: String,
  date: { type: String, required: true },           // YYYY-MM-DD
  startTime: String, endTime: String,               // পরিকল্পিত সময় HH:mm
  assignedTo: String,                               // কাকে সিডিউল দেওয়া হয়েছে
  location: { type: String, default: "Office" },
  charge: { type: Number, default: 0 }, paid: { type: Number, default: 0 },
  usePackage: { type: Boolean, default: false },    // প্যাকেজের ঘন্টা থেকে কাটবে কিনা
  expectedDeliveryDate: String, deliveryEstimate: String,
  deliveryPhone: String,                            // অন্য নাম্বারে ডেলিভারি (ঐচ্ছিক)
  sessions: [SessionSchema],                        // আসল শুটিং সেশন (একাধিক দিনে যোগ হবে)
  actualStart: String, actualEnd: String,           // পুরোনো ডেটার জন্য (অটো sessions এ চলে যায়)
  durationMinutes: Number,                          // সব সেশনের মোট মিনিট
  status: { type: String, enum: ["pending", "approved", "completed", "delivered", "rejected"], default: "pending" },
  approvedAt: Date, completedAt: Date, deliveredAt: Date,
  driveLinks: [String], deliveryNote: String, optionalNote: String,
}, { timestamps: true });
export default mongoose.models.Job || mongoose.model("Job", JobSchema);
