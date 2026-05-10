import React, { useState } from "react";

import AuthorityHome from "./AuthorityHome";
import AuthorityComplaints from "./AuthorityComplaints";
import AuthorityWorkAllotment from "./AuthorityWorkAllotment";
import AuthorityMaterials from "./AuthorityMaterials";
import AuthorityReviews from "./AuthorityReviews";

export default function GovtAuthorityDashboard({ authorityData, onLogout }) {
  const [activePage, setActivePage] = useState("home");

  return (
    <div className="adminLayout">
      <div className="adminSidebar">
        <h2>Govt Authority</h2>

        <button className="menuBtn" onClick={() => setActivePage("home")}>
          Dashboard
        </button>

        <button
          className="menuBtn"
          onClick={() => setActivePage("complaints")}
        >
          Public Complaints
        </button>

        <button className="menuBtn" onClick={() => setActivePage("work")}>
          Work Allotment
        </button>

        <button
          className="menuBtn"
          onClick={() => setActivePage("materials")}
        >
          Materials Used
        </button>

        <button className="menuBtn" onClick={() => setActivePage("reviews")}>
          Citizen Reviews
        </button>

        <button className="logoutBtn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="adminContent">
        {activePage === "home" && (
          <AuthorityHome authorityData={authorityData} />
        )}

        {activePage === "complaints" && <AuthorityComplaints />}
        {activePage === "work" && <AuthorityWorkAllotment />}
        {activePage === "materials" && <AuthorityMaterials />}
        {activePage === "reviews" && <AuthorityReviews />}
      </div>
    </div>
  );
}