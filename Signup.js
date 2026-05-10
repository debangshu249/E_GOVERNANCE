import React, { useState } from "react";

export default function Signup({ onSignupDone, onLogin }) {
  const [userType, setUserType] = useState("public");

  const [name, setName] = useState("");
  const [authorityName, setAuthorityName] = useState("");
  const [department, setDepartment] = useState("");

  const [address, setAddress] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [mobile, setMobile] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password || !mobile) {
      alert("Please fill email, mobile and password.");
      return;
    }

    if (userType === "public" && !name) {
      alert("Please enter your name.");
      return;
    }

    if (userType === "authority" && (!authorityName || !department)) {
      alert("Please enter authority name and department.");
      return;
    }

    const userData = {
      userType,
      name,
      authorityName,
      department,
      address,
      aadhaar,
      mobile,
      email,
      password
    };

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        alert("Signup successful! Now login.");

        if (onSignupDone) {
          onSignupDone();
        }
      } else {
        alert(data.message || "Signup failed.");
      }
    } catch (error) {
      alert("Backend connect nahi ho raha. Backend start karo.");
    }
  };

  return (
    <div className="register-box">
      <h2>Signup</h2>

      <div className="userTypeBox">
        <button
          type="button"
          className={userType === "public" ? "activeType" : ""}
          onClick={() => setUserType("public")}
        >
          Public
        </button>

        <button
          type="button"
          className={userType === "authority" ? "activeType" : ""}
          onClick={() => setUserType("authority")}
        >
          Govt Authority
        </button>
      </div>

      <p className="selectedLoginType">
        Selected Signup Type:{" "}
        <strong>
          {userType === "authority" ? "Govt Authority" : "Public"}
        </strong>
      </p>

      <form onSubmit={handleSignup}>
        {userType === "public" ? (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Authority Name"
              value={authorityName}
              onChange={(e) => setAuthorityName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </>
        )}

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <input
          type="text"
          placeholder="Aadhaar Number"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
        />

        <input
          type="text"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email / Gmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="buttonRow">
          <button type="submit">Create Account</button>
          <button type="button" onClick={onLogin}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
}