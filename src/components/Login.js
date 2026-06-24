import React, { useState } from "react";
import { ethers } from "ethers";

export default function Login({ onLogin, onSignup, onBack }) {
  const [userType, setUserType] = useState("public");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [web3Status, setWeb3Status] = useState(""); 

  // --- TRADITIONAL LOGIN (For Authority Only) ---
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
        alert("Government Authority login successful!");
        onLogin(data.user);
      } else {
        alert(data.message || "Invalid login credentials!");
      }
    } catch (error) {
      alert("Backend connection failed. Please start the backend server.");
    }
  };

  // --- NEW WEB3 LOGIN LOGIC (For Public Only) ---
  const handleWeb3Login = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet extension!");
      return;
    }

    try {
      setWeb3Status("Connecting to wallet...");

      // Request MetaMask accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 🔥 TRANSACTION STEP: Login korar aage 0.0001 ETH fee katbe 🔥
      setWeb3Status("MetaMask e Login Fee (0.0001 ETH) Approve kor...");
      const authorityAddress = "0x000000000000000000000000000000000000dEaD"; 
      const feeAmount = ethers.parseEther("0.0001"); 

      const tx = await signer.sendTransaction({
          to: authorityAddress,
          value: feeAmount
      });

      setWeb3Status("Transaction verify hocche... Ektu wait kor!");
      await tx.wait();

      setWeb3Status("Payment Success! Fetching secure nonce...");

      // Step 1: Get nonce from server
      const nonceRes = await fetch("http://localhost:5000/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress })
      });
      const nonceData = await nonceRes.json();

      if (!nonceData.success) {
        alert(nonceData.error || "Failed to get nonce from server.");
        setWeb3Status("");
        return;
      }

      setWeb3Status("Please sign the message in your wallet...");

      // Step 2: Sign the nonce
      const signature = await signer.signMessage(nonceData.nonce);

      setWeb3Status("Verifying signature...");

      // Step 3: Verify signature on server
      const verifyRes = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature })
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setWeb3Status("");
        // Force userType to 'public' for Web3 logins
        if (verifyData.user) {
            verifyData.user.userType = 'public';
        }
        onLogin(verifyData.user);
      } else {
        setWeb3Status("");
        alert("Web3 Login Failed: " + (verifyData.error || "Verification failed."));
      }
    } catch (error) {
      console.error("Web3 Login Error:", error);
      setWeb3Status("");
      if (error.code === 4001) {
        alert("You rejected the transaction or signature request in MetaMask.");
      } else {
        alert("Web3 login failed: " + (error.message || "Unknown error"));
      }
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
            onClick={() => { setUserType("public"); setWeb3Status(""); }}
          >
            Public
          </button>

          <button
            type="button"
            className={
              userType === "authority" ? "roleTab activeRole" : "roleTab"
            }
            onClick={() => { setUserType("authority"); setWeb3Status(""); }}
          >
            Government Authority
          </button>
        </div>

        {/* AUTHORITY: Traditional email/password login */}
        {userType === "authority" && (
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
        )}

        {/* PUBLIC: Email/Password + Web3 wallet login */}
        {userType === "public" && (
          <div className="loginFormNew" style={{ padding: "20px 0" }}>

            {/* Email/Password Login */}
            <form onSubmit={handleLogin}>

            {web3Status && (
              <p style={{ marginTop: "0", marginBottom: "15px", fontSize: "14px", color: "#0056b3", fontWeight: "bold", textAlign: "center" }}>
                {web3Status}
              </p>
            )}
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

              <button
                type="button"
                onClick={handleWeb3Login}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #b4dcf7ff 0%, #a1d9ffff 50%, #fb9dd2ff 100%)",
                  color: "#081830ff",
                  border: "2px solid #101010ff",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontWeight: "700",
                  fontSize: "15px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 12px rgba(139, 92, 246, 0.15)",
                  letterSpacing: "0.3px",
                  marginTop: "5px"
                }}
              >
                🦊 Sign in with Web3 Wallet
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}