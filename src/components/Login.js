import React, { useState } from "react";
import { ethers } from "ethers"; // <-- We need this for Web3

export default function Login({ onLogin, onSignup, onBack }) {
  const [userType, setUserType] = useState("public");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [web3Status, setWeb3Status] = useState(""); // <-- New state for Web3 loading text

  // --- TRADITIONAL LOGIN ---
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

  // --- NEW WEB3 LOGIN LOGIC ---
  const handleWeb3Login = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet extension!");
      return;
    }

    try {
      setWeb3Status("Connecting to wallet...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWeb3Status("Fetching secure nonce...");

      const nonceRes = await fetch(`http://localhost:5000/api/web3/nonce?address=${address}`);
      const nonceData = await nonceRes.json();

      if (!nonceData.success) {
        alert(nonceData.error);
        setWeb3Status("");
        return;
      }

      const message = `Sign this message to log into the Road Management Platform.\n\nNonce: ${nonceData.nonce}`;

      setWeb3Status("Please sign the message in your wallet...");

      const signature = await signer.signMessage(message);

      setWeb3Status("Verifying signature...");

      const verifyRes = await fetch("http://localhost:5000/api/web3/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature })
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setWeb3Status("");
        alert("Web3 Login successful!");
        onLogin(verifyData.user);
      } else {
        setWeb3Status("");
        alert("Web3 Login Failed: " + verifyData.error);
      }
    } catch (error) {
      console.error(error);
      setWeb3Status("");
      alert("Web3 login process was cancelled or failed.");
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

          {/* --- NEW WEB3 BUTTON UI --- */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", margin: "15px 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }}></div>
              <span style={{ margin: "0 10px", color: "#666", fontSize: "14px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }}></div>
            </div>

            <button
              type="button"
              onClick={handleWeb3Login}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#f3f4f6",
                color: "#333",
                border: "1px solid #d1d5db",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px"
              }}
            >
              🦊 Sign in with Web3 Wallet
            </button>

            {/* Shows loading status (Connecting..., Verifying...) */}
            {web3Status && (
              <p style={{ marginTop: "10px", fontSize: "14px", color: "#0056b3" }}>
                {web3Status}
              </p>
            )}
          </div>
          {/* -------------------------- */}

        </form>
      </div>
    </div>
  );
}