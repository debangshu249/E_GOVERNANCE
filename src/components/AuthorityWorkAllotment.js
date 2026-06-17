import React, { useEffect, useState } from "react";

export default function AuthorityWorkAllotment() {
  const [complaints, setComplaints] = useState([]);
  const [workAllotments, setWorkAllotments] = useState([]);

  const [complaintId, setComplaintId] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [workDetails, setWorkDetails] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchComplaints();
    fetchWorkAllotments();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/complaints");
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      alert("Complaints could not be loaded.");
    }
  };

  const fetchWorkAllotments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/work-allotments");
      const data = await response.json();

      if (data.success) {
        setWorkAllotments(data.workAllotments);
      }
    } catch (error) {
      alert("Work allotments could not be loaded.");
    }
  };

  const handleAllotWork = async (e) => {
    e.preventDefault();

    if (!complaintId || !contractorName || !workDetails || !startDate) {
      alert("Please fill complaint, contractor, work details and start date.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/work-allotments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          complaintId,
          contractorName,
          workDetails,
          startDate,
          endDate
        })
      });

      const data = await response.json();

      if (data.success) {
        alert("Work allotted successfully!");

        setComplaintId("");
        setContractorName("");
        setWorkDetails("");
        setStartDate("");
        setEndDate("");

        fetchWorkAllotments();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Work allotment failed.");
    }
  };

  return (
    <div className="pageBox">
      <h2>Work Allotment</h2>

      <form onSubmit={handleAllotWork}>
        <label>Select Complaint</label>

        <select
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
        >
          <option value="">Select Complaint ID</option>

          {complaints.map((item) => (
            <option key={item.id} value={item.id}>
              {item.id} -{" "}
              {item.area || item.placeName || item.address || "Location"}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Contractor Name"
          value={contractorName}
          onChange={(e) => setContractorName(e.target.value)}
        />

        <textarea
          placeholder="Work Details"
          value={workDetails}
          onChange={(e) => setWorkDetails(e.target.value)}
        />

        <label>Work Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <label>Work End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button type="submit">Allot Work</button>
      </form>

      <h3 style={{ marginTop: "25px" }}>All Work Allotments</h3>

      {workAllotments.length === 0 ? (
        <p>No work allotments available.</p>
      ) : (
        workAllotments.map((item) => (
          <div key={item.id} className="listCard">
            <p>
              <strong>Complaint ID:</strong> {item.complaintId}
            </p>

            <p>
              <strong>Contractor:</strong> {item.contractorName}
            </p>

            <p>
              <strong>Work Details:</strong> {item.workDetails}
            </p>

            <p>
              <strong>Start Date:</strong> {item.startDate || "Not Updated"}
            </p>

            <p>
              <strong>End Date:</strong> {item.endDate || "Not Updated"}
            </p>

            <p>
              <strong>Allotment Date:</strong> {item.date}
            </p>
          </div>
        ))
      )}
    </div>
  );
}