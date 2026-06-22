const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min TTL
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
//      WEB3 BLOCKCHAIN LOGIN ENDPOINTS
// ==========================================

// 1. Challenge Nonce create korar API
app.post('/api/auth/nonce', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) return res.status(400).json({ success: false, error: 'Wallet address missing' });

        const cleanAddress = walletAddress.toLowerCase();
        
        // Dynamic secure message challenge
        const randomNonce = `Welcome to Road Management Platform! Sign challenge ID: ${crypto.randomBytes(16).toString('hex')}`;

        await Nonce.findOneAndUpdate(
            { address: cleanAddress },
            { nonce: randomNonce, createdAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, nonce: randomNonce });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error creating nonce' });
    }
});

// 2. Crypto Signature Verify korar API (UPDATED FOR PUBLIC REDIRECT)
app.post('/api/auth/verify', async (req, res) => {
    try {
        const { walletAddress, signature } = req.body;
        if (!walletAddress || !signature) return res.status(400).json({ success: false, error: 'Params missing' });

        const cleanAddress = walletAddress.toLowerCase();

        const dbRecord = await Nonce.findOne({ address: cleanAddress });
        if (!dbRecord) return res.status(400).json({ success: false, error: 'Nonce missing ba expired' });

        // Recover wallet address cryptographically using ethers v6
        const recoveredAddress = ethers.verifyMessage(dbRecord.nonce, signature);

        if (recoveredAddress.toLowerCase() !== cleanAddress) {
            return res.status(401).json({ success: false, error: 'Invalid crypto signature!' });
        }

        // Clean used nonce
        await Nonce.deleteOne({ address: cleanAddress });

        // Find user
        let user = await User.findOne({ walletAddress: cleanAddress });
        
        if (!user) {
            // Jodi notun user hoy, tahole 'public' hisabe create korbo
            user = await User.create({
                walletAddress: cleanAddress,
                userType: 'public', 
                createdAt: new Date()
            });
        } else if (user.userType === 'authority') {
            // Jodi aage theke 'authority' save thake, setake 'public' kore update korbo
            user.userType = 'public';
            await user.save();
        }

        const token = jwt.sign(
            { userId: user._id, walletAddress: user.walletAddress, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // ===== DEBUG LINES - REMOVE AFTER FIXING =====
        console.log('DEBUG walletAddress used:', cleanAddress);
        console.log('DEBUG user found/created:', user);
        console.log('DEBUG userType being sent:', user.userType);
        // ===== END DEBUG LINES =====

        res.json({ success: true, token, userType: user.userType, user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Verification error server-side' });
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

// SERVER LISTEN (Always leaves at the bottom)
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});