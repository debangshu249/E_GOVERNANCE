import React, { useEffect, useState } from "react";

export default function AuthorityComplaints() {
  const [complaints, setComplaints] = useState([]);

  const statuses = [
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
      alert("Complaints load nahi ho paayi.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Status updated.");
        fetchComplaints();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Status update failed.");
    }
  };

  return (
    <div className="pageBox">
      <h2>All Public Complaints</h2>

      {complaints.length === 0 ? (
        <div className="listCard">
          <p>No complaints available.</p>
        </div>
      ) : (
        complaints.map((item, index) => (
          <div key={item.id || index} className="listCard">
            <h3>{item.id || `Complaint ${index + 1}`}</h3>

            {item.photo && (
              <img src={item.photo} alt="Complaint" className="photoPreview" />
            )}

            <p>
              <strong>Name:</strong> {item.name || "Unknown"}
            </p>

            <p>
              <strong>Mobile:</strong> {item.mobile || "N/A"}
            </p>

            <p>
              <strong>Place:</strong> {item.placeName || "Not detected"}
            </p>

            <p>
              <strong>Area:</strong> {item.area || "Not detected"}
            </p>

            <p>
              <strong>Authority:</strong>{" "}
              {item.authority || "Municipal Authority"}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {item.address && item.address.includes("google.com/maps") ? (
                <a href={item.address} target="_blank" rel="noreferrer">
                  Open Map
                </a>
              ) : (
                item.address || "No location"
              )}
            </p>

            <p>
              <strong>Description:</strong> {item.desc || "No description"}
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
              <strong>Status:</strong>{" "}
              <span className="status progress">
                {item.status || "Complaint Submitted"}
              </span>
            </p>

            <label>Update Status</label>
            <select
              value={item.status || "Complaint Submitted"}
              onChange={(e) => updateStatus(item.id, e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <p>
              <strong>Date:</strong>{" "}
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}