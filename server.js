const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = 5000;
const JWT_SECRET = "road_management_super_secret_key";

// ==========================================
//          MONGODB ATLAS CONNECTION
// ==========================================
mongoose.connect("mongodb+srv://dbms:dbms@roadcarecluster.mfmtssn.mongodb.net/road_management?retryWrites=true&w=majority&appName=RoadCareCluster")
  .then(() => console.log("Connected to MongoDB Atlas successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ==========================================
//          MONGOOSE SCHEMAS & MODELS
// ==========================================
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String },
  userType: { type: String, enum: ["public", "authority"] },
  walletAddress: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const NonceSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const ComplaintSchema = new mongoose.Schema({
  status: { type: String, default: "Complaint Submitted" },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const WorkAllotmentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }
}, { strict: false });

const MaterialSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }
}, { strict: false });

const FeedbackSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now }
}, { strict: false });

const User = mongoose.model("User", UserSchema);
const Nonce = mongoose.model("Nonce", NonceSchema);
const Otp = mongoose.model("Otp", OtpSchema);
const Complaint = mongoose.model("Complaint", ComplaintSchema);
const WorkAllotment = mongoose.model("WorkAllotment", WorkAllotmentSchema);
const Material = mongoose.model("Material", MaterialSchema);
const Feedback = mongoose.model("Feedback", FeedbackSchema);

// ==========================================
//          EMAIL TRANSPORTER
// ==========================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "YOUR_GMAIL@gmail.com",
    pass: "YOUR_GMAIL_APP_PASSWORD",
  },
});

app.get("/", (req, res) => res.send("Road Management MongoDB Backend Running"));

// ==========================================
//          WEB3 BLOCKCHAIN LOGIN
// ==========================================
app.get("/api/web3/nonce", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ success: false, error: "Address required" });

    const nonce = Math.floor(Math.random() * 1000000).toString();
    const lowerAddress = address.toLowerCase();

    await Nonce.findOneAndUpdate(
      { address: lowerAddress },
      { nonce, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    res.json({ success: true, nonce });
  } catch (error) {
    res.status(500).json({ success: false, error: "Database error" });
  }
});

app.post("/api/web3/verify", async (req, res) => {
  try {
    const { address, signature } = req.body;
    const lowerAddress = address.toLowerCase();

    const nonceDoc = await Nonce.findOne({ address: lowerAddress });
    if (!nonceDoc) return res.status(400).json({ success: false, error: "Nonce expired or not found." });

    const message = `Sign this message to log into the Road Management Platform.\n\nNonce: ${nonceDoc.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === lowerAddress) {
      await Nonce.deleteOne({ address: lowerAddress });

      let user = await User.findOne({ walletAddress: lowerAddress });
      if (!user) {
        user = await User.create({
          walletAddress: lowerAddress,
          userType: "authority",
          email: lowerAddress
        });
      }

      const token = jwt.sign({ userId: user._id, address: lowerAddress }, JWT_SECRET, { expiresIn: "2h" });
      return res.json({ success: true, message: "Web3 Login successful", token, user });
    } else {
      return res.status(401).json({ success: false, error: "Signature verification failed" });
    }
  } catch (err) {
    console.error("Web3 Verify Error:", err);
    res.status(500).json({ success: false, error: "Server error during verification" });
  }
});

// ==========================================
//        TRADITIONAL AUTHENTICATION
// ==========================================
app.post("/api/signup", async (req, res) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { mobile: req.body.mobile }]
    });

    if (existingUser) return res.json({ success: false, message: "User already exists" });

    const newUser = await User.create(req.body);
    res.json({ success: true, message: "Signup successful", user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    const user = await User.findOne({
      $or: [{ email }, { mobile: email }],
      password,
      userType
    });

    if (!user) return res.json({ success: false, message: "Invalid login credentials" });
    res.json({ success: true, message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate({ email }, { otp, createdAt: Date.now() }, { upsert: true });

    await transporter.sendMail({
      from: "YOUR_GMAIL@gmail.com",
      to: email,
      subject: "Road Management Password Reset OTP",
      text: `Your OTP is ${otp}. This OTP is valid for 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.json({ success: false, message: "OTP send failed. Check Gmail config." });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) return res.json({ success: false, message: "Invalid or expired OTP" });

    await User.findOneAndUpdate({ email }, { password: newPassword });
    await Otp.deleteOne({ email });

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ==========================================
//        PLATFORM DATA ROUTES
// ==========================================
app.post("/api/complaints", async (req, res) => {
  const newComplaint = await Complaint.create(req.body);
  res.json({ success: true, message: "Complaint submitted successfully", complaint: newComplaint });
});

app.get("/api/complaints", async (req, res) => {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  res.json({ success: true, complaints });
});

app.put("/api/complaints/:id/status", async (req, res) => {
  const updated = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json({ success: true, message: "Status updated", complaint: updated });
});

app.delete("/api/complaints/:id", async (req, res) => {
  await Complaint.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Complaint deleted" });
});

app.post("/api/work-allotments", async (req, res) => {
  const newWork = await WorkAllotment.create(req.body);
  if (req.body.complaintId) {
    await Complaint.findByIdAndUpdate(req.body.complaintId, { status: "Work Allotted" });
  }
  res.json({ success: true, message: "Work allotted successfully", work: newWork });
});

app.get("/api/work-allotments", async (req, res) => {
  const workAllotments = await WorkAllotment.find().sort({ date: -1 });
  res.json({ success: true, workAllotments });
});

app.post("/api/materials", async (req, res) => {
  const newMaterial = await Material.create(req.body);
  res.json({ success: true, message: "Material added", material: newMaterial });
});

app.get("/api/materials", async (req, res) => {
  const materials = await Material.find().sort({ date: -1 });
  res.json({ success: true, materials });
});

app.post("/api/feedbacks", async (req, res) => {
  const newFeedback = await Feedback.create(req.body);
  res.json({ success: true, message: "Feedback submitted", feedback: newFeedback });
});

app.get("/api/feedbacks", async (req, res) => {
  const feedbacks = await Feedback.find().sort({ date: -1 });
  res.json({ success: true, feedbacks });
});

app.get("/api/reviews", async (req, res) => {
  const reviews = await Feedback.find().sort({ date: -1 });
  res.json({ success: true, reviews });
});

app.get("/api/authority/summary", async (req, res) => {
  const [totalComplaints, totalWorkAllotments, totalMaterials, totalReviews] = await Promise.all([
    Complaint.countDocuments(),
    WorkAllotment.countDocuments(),
    Material.countDocuments(),
    Feedback.countDocuments()
  ]);

  res.json({
    success: true,
    totalComplaints,
    totalReviews,
    totalWorkAllotments,
    totalMaterials,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});