import React, { useEffect, useState } from "react";

export default function AuthorityHome({ authorityData }) {
  const [summary, setSummary] = useState({
    totalComplaints: 0,
    totalReviews: 0,
    totalWorkAllotments: 0,
    totalMaterials: 0
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/authority/summary");
      const data = await response.json();

      if (data.success) {
        setSummary(data);
      }
    } catch (error) {
      alert("Summary load nahi ho paayi.");
    }
  };

  return (
    <div>
      <div className="welcomeBox">
        <h1>
          Welcome,{" "}
          {authorityData?.authorityName ||
            authorityData?.name ||
            "Authority"}
        </h1>

        <p>
          Department: {authorityData?.department || "Not Available"}
        </p>
      </div>

      <div className="dashboardGrid">
        <div className="dashCard">
          <h3>Total Complaints</h3>
          <p>{summary.totalComplaints}</p>
        </div>

        <div className="dashCard">
          <h3>Total Reviews</h3>
          <p>{summary.totalReviews}</p>
        </div>

        <div className="dashCard">
          <h3>Work Allotments</h3>
          <p>{summary.totalWorkAllotments}</p>
        </div>

        <div className="dashCard">
          <h3>Materials Records</h3>
          <p>{summary.totalMaterials}</p>
        </div>
      </div>
    </div>
  );
}