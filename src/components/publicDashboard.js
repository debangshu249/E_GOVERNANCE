import React, { useEffect, useState } from "react";

export default function PublicDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [searchText, setSearchText] = useState("");

  const steps = [
    "Complaint Submitted",
    "Approved",
    "Work Allotted",
    "Work In Progress",
    "Resolved"
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/complaints");
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      alert("Backend se complaints load nahi ho paayi.");
    }
  };

  const getCurrentIndex = (status) => {
    const index = steps.indexOf(status || "Complaint Submitted");
    return index === -1 ? 0 : index;
  };

  const getProgressPercent = (status) => {
    const currentIndex = getCurrentIndex(status);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const filteredComplaints =
    searchText.trim() === ""
      ? []
      : complaints.filter((item) => {
          const search = searchText.toLowerCase();

          const gpsText = item.location
            ? `${item.location.lat} ${item.location.lng}`
            : "";

          const allText = `
            ${item.placeName || ""}
            ${item.area || ""}
            ${item.nearby || ""}
            ${item.authority || ""}
            ${item.address || ""}
            ${item.desc || ""}
            ${item.name || ""}
            ${gpsText}
          `.toLowerCase();

          return allText.includes(search);
        });

  return (
    <div className="pageBox">
      <h2>Public Dashboard</h2>

      <div className="filterBox">
        <h3>Search Complaint by Location</h3>

        <label>Search Location / Area / GPS / Name</label>

        <input
          type="text"
          placeholder="Example: Kolkata, Delhi, Bangalore, road name, GPS"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <p className="small">
          {searchText.trim() === ""
            ? "Search a location to view complaints."
            : `Showing ${filteredComplaints.length} complaint(s)`}
        </p>
      </div>

      {searchText.trim() === "" ? (
        <p>Please search a location to view complaints.</p>
      ) : filteredComplaints.length === 0 ? (
        <p>No complaints found for this location.</p>
      ) : (
        filteredComplaints.map((item, index) => {
          const currentStatus = item.status || "Complaint Submitted";
          const currentIndex = getCurrentIndex(currentStatus);
          const progressPercent = getProgressPercent(currentStatus);

          return (
            <div key={item.id || index} className="listCard">
              <h3>{item.id || "Road Issue Complaint"}</h3>

              {item.photo && (
                <img
                  src={item.photo}
                  alt="complaint"
                  className="photoPreview"
                />
              )}

              <p>
                <strong>Name:</strong> {item.name || "Unknown"}
              </p>

              <p>
                <strong>Mobile:</strong> {item.mobile || "N/A"}
              </p>

              <p>
                <strong>Detected Place:</strong>{" "}
                {item.placeName || "Not detected"}
              </p>

              <p>
                <strong>Area:</strong> {item.area || "Not detected"}
              </p>

              <p>
                <strong>Nearby:</strong> {item.nearby || "Not detected"}
              </p>

              <p>
                <strong>Responsible Authority:</strong>{" "}
                {item.authority || "Municipal Authority"}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {item.desc || "No description"}
              </p>

              <p>
                <strong>Problem Status:</strong> {currentStatus}
              </p>

              {item.location && (
                <div className="gpsBox">
                  <p>
                    <strong>GPS Coordinates:</strong>
                  </p>
                  <p>Latitude: {item.location.lat}</p>
                  <p>Longitude: {item.location.lng}</p>
                </div>
              )}

              <p>
                <strong>Google Map:</strong>{" "}
                {item.address && item.address.includes("google.com/maps") ? (
                  <a href={item.address} target="_blank" rel="noreferrer">
                    Open Map
                  </a>
                ) : (
                  "No map link"
                )}
              </p>

              <div className="flowchartBox">
                <h4>Complaint Progress</h4>

                <div className="currentStatusBox">
                  Current Status: {currentStatus}
                </div>

                <div className="progressBar">
                  <div
                    className="progressFill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                <p className="progressText">
                  {Math.round(progressPercent)}% Completed
                </p>

                <div className="flowchart">
                  {steps.map((step, i) => (
                    <React.Fragment key={step}>
                      <div
                        className={`flowStep ${
                          currentIndex >= i ? "active" : ""
                        }`}
                      >
                        {step}
                      </div>

                      {i < steps.length - 1 && <div className="arrow">→</div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}