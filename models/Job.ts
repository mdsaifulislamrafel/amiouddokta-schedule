import mongoose, { Schema } from "mongoose";
const SessionSchema = new Schema({
  date: { type: String, required: true },      // YYYY-MM-DD
  start: String,                               // HH:mm (এডিটের কাজে না দিলেও চলবে)
  end: String,
  minutes: { type: Number, default: 0 },
  note: String,
});
const JobSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
  jobType: { type: String, enum: ["shoot", "edit"], default: "shoot" }, // shoot = আমাদের শুটিং, edit = বাইরের ফুটেজ শুধু এডিট
  serviceType: { type: String, required: true },
  title: String,
  date: { type: String, required: true },           // YYYY-MM-DD (এডিটের ক্ষেত্রে ফুটেজ পাওয়ার তারিখ)
  startTime: String, endTime: String,               // পরিকল্পিত সময় HH:mm
  assignedTo: String,                               // কাকে সিডিউল / এডিটর
  location: { type: String, default: "Office" },
  footageSource: String,                            // client_self | other_studio
  footageLinks: [String],                           // কাঁচা ফুটেজের লিংক
  footageNote: String,                              // ফুটেজ সম্পর্কে / এডিটের নির্দেশনা
  charge: { type: Number, default: 0 }, paid: { type: Number, default: 0 },
  usePackage: { type: Boolean, default: false },    // প্যাকেজ থেকে কাটবে কিনা
  deductFrom: { type: String, enum: ["hours", "money"], default: "hours" }, // প্যাকেজের ঘন্টা নাকি টাকা থেকে
  expectedDeliveryDate: String, deliveryEstimate: String,
  deliveryPhone: String,                            // অন্য নাম্বারে ডেলিভারি (ঐচ্ছিক)
  sessions: [SessionSchema],                        // আসল কাজের সেশন (শুটিং বা এডিটিং সময়)
  actualStart: String, actualEnd: String,           // পুরোনো ডেটার জন্য (অটো sessions এ চলে যায়)
  durationMinutes: Number,                          // সব সেশনের মোট মিনিট
  status: { type: String, enum: ["pending", "approved", "completed", "delivered", "rejected"], default: "pending" },
  approvedAt: Date, completedAt: Date, deliveredAt: Date,
  driveLinks: [String], deliveryNote: String, optionalNote: String,
}, { timestamps: true });
export default (mongoose.models.Job || mongoose.model("Job", JobSchema)) as any;
