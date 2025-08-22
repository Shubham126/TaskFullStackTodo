import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, enum: ["admin", "manager", "user"], default: "user" }
});

export default mongoose.model("Employee", employeeSchema);
