import React, { useState } from "react";

export default function Login({ onLogin, onSignup, onBack }) {
  const [userType, setUserType] = useState("public");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          userType
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(
          userType === "authority"
            ? "Government Authority login successful!"
            : "Public login successful!"
        );

        onLogin(data.user);
      } else {
        alert(data.message || "Invalid login credentials!");
      }
    } catch (error) {
      alert("Backend connection failed. Please start the backend server.");
    }
  };

  const handleForgotPassword = async () => {
    const userEmail = prompt("Enter your registered email address");

    if (!userEmail) return;

    try {
      const sendResponse = await fetch("http://localhost:5000/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: userEmail
        })
      });

      const sendData = await sendResponse.json();

      if (!sendData.success) {
        alert(sendData.message);
        return;
      }

      alert("OTP has been sent to your email address.");

      const otp = prompt("Enter OTP");
      if (!otp) return;

      const newPassword = prompt("Enter your new password");
      if (!newPassword) return;

      const resetResponse = await fetch(
        "http://localhost:5000/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: userEmail,
            otp,
            newPassword
          })
        }
      );

      const resetData = await resetResponse.json();

      if (resetData.success) {
        alert("Password reset successful!");
      } else {
        alert(resetData.message);
      }
    } catch (error) {
      alert("Backend connection failed.");
    }
  };

  return (
    <div className="loginScreen">
      <div className="loginBoxNew">
        {onBack && (
          <button type="button" className="backArrowBtn" onClick={onBack}>
            <span className="backArrowIcon">←</span>
            <span>Back</span>
          </button>
        )}

        <h2 className="loginHeading">Log In</h2>

        <div className="roleTabs">
          <button
            type="button"
            className={userType === "public" ? "roleTab activeRole" : "roleTab"}
            onClick={() => setUserType("public")}
          >
            Public
          </button>

          <button
            type="button"
            className={
              userType === "authority" ? "roleTab activeRole" : "roleTab"
            }
            onClick={() => setUserType("authority")}
          >
            Government Authority
          </button>
        </div>

        <form className="loginFormNew" onSubmit={handleLogin}>
          <input
            className="authInput"
            type="text"
            placeholder="Email or Mobile Number"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="authPasswordBox">
            <input
              className="authInput authPasswordInput"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="passwordEyeBtn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          <div className="authLinks">
            <button
              type="button"
              className="textLinkBtn"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>

            <button type="button" className="textLinkBtn" onClick={onSignup}>
              Sign Up
            </button>
          </div>

          <button type="submit" className="authSubmitBtn">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}