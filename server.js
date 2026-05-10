const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = 5000;
const DATA_FILE = path.join(__dirname, "data.json");

const otpStore = {};

const readData = () => {
  const fileData = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(fileData);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "YOUR_GMAIL@gmail.com",
    pass: "YOUR_GMAIL_APP_PASSWORD",
  },
});

app.get("/", (req, res) => {
  res.send("Road Management Backend Running");
});

/* SIGNUP */
app.post("/api/signup", (req, res) => {
  const data = readData();

  const newUser = {
    id: "USER-" + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };

  const existingUser = data.users.find(
    (user) => user.email === newUser.email || user.mobile === newUser.mobile
  );

  if (existingUser) {
    return res.json({
      success: false,
      message: "User already exists",
    });
  }

  data.users.push(newUser);
  writeData(data);

  res.json({
    success: true,
    message: "Signup successful",
    user: newUser,
  });
});

/* LOGIN */
app.post("/api/login", (req, res) => {
  const data = readData();

  const { email, password, userType } = req.body;

  const user = data.users.find(
    (item) =>
      (item.email === email || item.mobile === email) &&
      item.password === password &&
      item.userType === userType
  );

  if (!user) {
    return res.json({
      success: false,
      message: "Invalid login credentials",
    });
  }

  res.json({
    success: true,
    message: "Login successful",
    user,
  });
});

/* SEND OTP */
app.post("/api/send-otp", async (req, res) => {
  const data = readData();
  const { email } = req.body;

  const user = data.users.find((item) => item.email === email);

  if (!user) {
    return res.json({
      success: false,
      message: "User not found",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await transporter.sendMail({
      from: "YOUR_GMAIL@gmail.com",
      to: email,
      subject: "Road Management Password Reset OTP",
      text: `Your OTP is ${otp}. This OTP is valid for 5 minutes.`,
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "OTP send failed. Gmail/App Password check karo.",
    });
  }
});

/* RESET PASSWORD */
app.post("/api/reset-password", (req, res) => {
  const data = readData();

  const { email, otp, newPassword } = req.body;

  const savedOtp = otpStore[email];

  if (!savedOtp) {
    return res.json({
      success: false,
      message: "OTP not found",
    });
  }

  if (Date.now() > savedOtp.expiresAt) {
    delete otpStore[email];
    return res.json({
      success: false,
      message: "OTP expired",
    });
  }

  if (savedOtp.otp !== otp) {
    return res.json({
      success: false,
      message: "Invalid OTP",
    });
  }

  const userIndex = data.users.findIndex((item) => item.email === email);

  if (userIndex === -1) {
    return res.json({
      success: false,
      message: "User not found",
    });
  }

  data.users[userIndex].password = newPassword;
  writeData(data);

  delete otpStore[email];

  res.json({
    success: true,
    message: "Password reset successful",
  });
});

/* ADD COMPLAINT */
app.post("/api/complaints", (req, res) => {
  const data = readData();

  const newComplaint = {
    id: "CMP-" + Date.now(),
    ...req.body,
    status: "Complaint Submitted",
    createdAt: new Date().toISOString(),
  };

  data.complaints.unshift(newComplaint);
  writeData(data);

  res.json({
    success: true,
    message: "Complaint submitted successfully",
    complaint: newComplaint,
  });
});

/* GET COMPLAINTS */
app.get("/api/complaints", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    complaints: data.complaints,
  });
});

/* UPDATE COMPLAINT STATUS */
app.put("/api/complaints/:id/status", (req, res) => {
  const data = readData();

  const { status } = req.body;

  const index = data.complaints.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.json({
      success: false,
      message: "Complaint not found",
    });
  }

  data.complaints[index].status = status;
  data.complaints[index].updatedAt = new Date().toISOString();

  writeData(data);

  res.json({
    success: true,
    message: "Status updated",
    complaint: data.complaints[index],
  });
});

/* DELETE COMPLAINT */
app.delete("/api/complaints/:id", (req, res) => {
  const data = readData();

  data.complaints = data.complaints.filter(
    (item) => item.id !== req.params.id
  );

  writeData(data);

  res.json({
    success: true,
    message: "Complaint deleted",
  });
});

/* WORK ALLOTMENT */
app.post("/api/work-allotments", (req, res) => {
  const data = readData();

  const newWork = {
    id: "WORK-" + Date.now(),
    ...req.body,
    date: new Date().toLocaleDateString(),
  };

  data.workAllotments.unshift(newWork);

  const complaintIndex = data.complaints.findIndex(
    (item) => item.id === req.body.complaintId
  );

  if (complaintIndex !== -1) {
    data.complaints[complaintIndex].status = "Work Allotted";
  }

  writeData(data);

  res.json({
    success: true,
    message: "Work allotted successfully",
    work: newWork,
  });
});

app.get("/api/work-allotments", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    workAllotments: data.workAllotments,
  });
});

/* MATERIALS */
app.post("/api/materials", (req, res) => {
  const data = readData();

  const newMaterial = {
    id: "MAT-" + Date.now(),
    ...req.body,
    date: new Date().toLocaleDateString(),
  };

  data.materials.unshift(newMaterial);
  writeData(data);

  res.json({
    success: true,
    message: "Material added",
    material: newMaterial,
  });
});

app.get("/api/materials", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    materials: data.materials,
  });
});

/* FEEDBACK + REVIEWS */
app.post("/api/feedbacks", (req, res) => {
  const data = readData();

  const newFeedback = {
    id: "FDB-" + Date.now(),
    ...req.body,
    date: new Date().toLocaleDateString(),
  };

  data.feedbacks.unshift(newFeedback);
  data.reviews.unshift(newFeedback);

  writeData(data);

  res.json({
    success: true,
    message: "Feedback submitted",
    feedback: newFeedback,
  });
});

app.get("/api/feedbacks", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    feedbacks: data.feedbacks,
  });
});

app.get("/api/reviews", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    reviews: data.reviews,
  });
});

/* SUMMARY */
app.get("/api/authority/summary", (req, res) => {
  const data = readData();

  res.json({
    success: true,
    totalComplaints: data.complaints.length,
    totalReviews: data.reviews.length,
    totalWorkAllotments: data.workAllotments.length,
    totalMaterials: data.materials.length,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});