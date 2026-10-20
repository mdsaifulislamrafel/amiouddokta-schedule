import mongoose from "mongoose";
const g: any = global;
const cached = g._mongoose || (g._mongoose = { conn: null, promise: null });
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  cached.promise = cached.promise || mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.promise;
  return cached.conn;
}
