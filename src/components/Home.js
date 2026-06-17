import React from "react";

export default function Home({ onLogin, onSignup, isPublic, isProcess }) {
  if (isProcess) {
    return (
      <div className="card">
        <h2>Road Complaint Work Process</h2>

        <ol>
          <li>The public user submits a complaint.</li>
          <li>The government authority reviews the complaint.</li>
          <li>The complaint gets approved.</li>
          <li>The work is assigned to a contractor.</li>
          <li>Material usage details are updated.</li>
          <li>The work status is updated as in progress.</li>
          <li>The complaint is marked as resolved.</li>
        </ol>

        <div className="infoBox">
          The complaint progress will be displayed in the public dashboard as a
          progress flow.
        </div>
      </div>
    );
  }

  if (isPublic) {
    return (
      <div className="card">
        <h2>Welcome to the Public Road Management System</h2>

        <p>
          This portal allows citizens to report road-related issues such as
          potholes, damaged roads, drainage issues, broken streets, and other
          public road problems.
        </p>

        <hr />

        <h4>Instructions</h4>

        <ol>
          <li>Open the Complaint Form.</li>
          <li>Upload a road image.</li>
          <li>Add your live GPS location.</li>
          <li>Write a description of the issue.</li>
          <li>Submit the complaint.</li>
          <li>Track the complaint status in the Public Dashboard.</li>
        </ol>

        <div className="infoBox">
          GPS location, Google Map link, complaint photo, and progress status
          will be displayed in the public dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="landingBox">
      <h1>Road Management System</h1>

      <p>
        Public users can submit road complaints and Government Authorities can
        manage and monitor those complaints.
      </p>

      <div className="landingButtons">
        <button onClick={onLogin}>Login</button>
        <button onClick={onSignup}>Signup</button>
      </div>
    </div>
  );
}