import React, { useState } from "react";
import "./index.css";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Complaint from "./components/Complaint";
import PublicDashboard from "./components/publicDashboard";
import Feedback from "./components/Feedback";
import GovtAuthorityDashboard from "./components/GovtAuthorityDashboard";
import WorkingProcess from "./components/WorkingProcess";

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);

    if (loggedInUser.userType === "authority") {
      setPage("authorityDashboard");
    } else {
      setPage("publicHome");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  if (user && user.userType === "authority") {
    return (
      <GovtAuthorityDashboard
        authorityData={user}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app">
      {!user && (
        <div className="content fullContent">
          {page === "login" && (
            <Login
              onLogin={handleLogin}
              onSignup={() => setPage("signup")}
            />
          )}

          {page === "signup" && (
            <Signup
              onSignupDone={() => setPage("login")}
              onLogin={() => setPage("login")}
              onBack={() => setPage("login")}
            />
          )}
        </div>
      )}

      {user && user.userType === "public" && (
        <>
          <div className="sidebar">
            <h1>Public Panel</h1>

            <button onClick={() => setPage("publicHome")}>Home</button>

            <button onClick={() => setPage("complaint")}>
              Complaint Form
            </button>

            <button onClick={() => setPage("publicDashboard")}>
              Public Dashboard
            </button>

            <button onClick={() => setPage("publicDashboard")}>
              Complaint Status
            </button>

            <button onClick={() => setPage("workingProcess")}>
              Working Process
            </button>

            <button onClick={() => setPage("feedback")}>Feedback</button>

            <button onClick={handleLogout}>Logout</button>
          </div>

          <div className="content">
            {page === "publicHome" && (
              <div className="card">
                <h2>Welcome to Road Complaint Management System</h2>

                <p>
                  This platform helps citizens report road-related problems
                  quickly and transparently. Users can submit road complaints
                  with a photo, live GPS location, description, and contact
                  details. Government authorities can review complaints, update
                  progress, assign contractors, and record material usage.
                </p>

                <hr />

                <h4>How This Website Works</h4>

                <ol>
                  <li>
                    <strong>Submit a Complaint</strong>
                    <br />
                    Open the Complaint Form, upload a clear road image, add your
                    live GPS location, and describe the road issue properly.
                  </li>

                  <li>
                    <strong>Track Complaint Status</strong>
                    <br />
                    Visit the Public Dashboard to check whether your complaint is
                    submitted, approved, allotted, in progress, or resolved.
                  </li>

                  <li>
                    <strong>Search by Location</strong>
                    <br />
                    Use the location search option to view complaints related to
                    a specific area, road, city, or GPS-based location.
                  </li>

                  <li>
                    <strong>View Work Progress</strong>
                    <br />
                    Open the Working Process section to see contractor details,
                    work start date, completion date, and materials used for the
                    repair work.
                  </li>

                  <li>
                    <strong>Give Feedback</strong>
                    <br />
                    After checking progress or completion, submit your feedback
                    to help improve the road maintenance process.
                  </li>
                </ol>

                <div className="infoBox">
                  For best results, upload a clear road photo and allow GPS
                  permission while submitting your complaint.
                </div>
              </div>
            )}

            {page === "complaint" && <Complaint user={user} />}

            {page === "publicDashboard" && <PublicDashboard />}

            {page === "workingProcess" && <WorkingProcess />}

            {page === "feedback" && <Feedback user={user} />}
          </div>
        </>
      )}
    </div>
  );
}