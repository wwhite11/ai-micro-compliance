import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema({
  title: String,
  explanation: String
}, { _id: false });

const RecommendationSchema = new mongoose.Schema({
  name: String,
  description: String,
  sampleClause: String,
  link: String
}, { _id: false });

const ContractCheckLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  promptVersion: { type: String, default: "v1.0" },
  contractTypeDetected: { type: String },
  inputContract: { type: String, required: true },
  outputIssues: [IssueSchema],
  outputRecommendations: [RecommendationSchema],
  outputImprovedContract: { type: String },
  approved: { type: Boolean, default: undefined }, // undefined = pending, true = approved, false = rejected
  adminNotes: { type: String, default: "" },
  approvedBy: { type: String, default: "" },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ContractCheckLog || mongoose.model("ContractCheckLog", ContractCheckLogSchema); 