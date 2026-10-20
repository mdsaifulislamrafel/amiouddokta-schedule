import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema({ username: { type: String, unique: true }, passwordHash: String }, { timestamps: true });

export default (mongoose.models.Admin || mongoose.model("Admin", AdminSchema)) as any;