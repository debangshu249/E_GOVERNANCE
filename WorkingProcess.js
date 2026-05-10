import React, { useEffect, useState } from "react";

export default function WorkingProcess() {
  const [complaints, setComplaints] = useState([]);
  const [workAllotments, setWorkAllotments] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    fetchWorkingData();
  }, []);

  const fetchWorkingData = async () => {
    try {
      const complaintRes = await fetch("http://localhost:5000/api/complaints");
      const complaintData = await complaintRes.json();

      const workRes = await fetch("http://localhost:5000/api/work-allotments");
      const workData = await workRes.json();

      const materialRes = await fetch("http://localhost:5000/api/materials");
      const materialData = await materialRes.json();

      if (complaintData.success) {
        setComplaints(complaintData.complaints);
      }

      if (workData.success) {
        setWorkAllotments(workData.workAllotments);
      }

      if (materialData.success) {
        setMaterials(materialData.materials);
      }
    } catch (error) {
      alert("Working process data could not be loaded.");
    }
  };

  const getComplaintById = (complaintId) => {
    return complaints.find((item) => item.id === complaintId);
  };

  const getMaterialsByComplaint = (complaintId) => {
    return materials.filter((item) => {
      const projectName = item.projectName || "";
      const itemComplaintId = item.complaintId || "";

      return (
        projectName === complaintId ||
        itemComplaintId === complaintId ||
        projectName.toLowerCase().includes(complaintId.toLowerCase())
      );
    });
  };

  return (
    <div className="pageBox">
      <h2>Working Process Details</h2>

      <p className="small">
        Contractor assignment, work dates, material usage, and complaint progress
        will appear here after the government authority updates them.
      </p>

      {workAllotments.length === 0 ? (
        <div className="listCard">
          <p>No work process details available yet.</p>
        </div>
      ) : (
        workAllotments.map((work) => {
          const complaint = getComplaintById(work.complaintId);
          const relatedMaterials = getMaterialsByComplaint(work.complaintId);

          return (
            <div key={work.id} className="listCard">
              <h3>Complaint ID: {work.complaintId}</h3>

              {complaint?.photo && (
                <img
                  src={complaint.photo}
                  alt="Complaint"
                  className="photoPreview"
                />
              )}

              <p>
                <strong>Complaint Status:</strong>{" "}
                <span className="status progress">
                  {complaint?.status || "Work Allotted"}
                </span>
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {complaint?.address?.includes("google.com/maps") ? (
                  <a href={complaint.address} target="_blank" rel="noreferrer">
                    Open Map
                  </a>
                ) : (
                  complaint?.address || "Not Available"
                )}
              </p>

              <p>
                <strong>Complaint Description:</strong>{" "}
                {complaint?.desc || "Not Available"}
              </p>

              <div className="workDetailBox">
                <h4>Contractor Details</h4>

                <p>
                  <strong>Contractor Name:</strong>{" "}
                  {work.contractorName || "Not Assigned"}
                </p>

                <p>
                  <strong>Work Details:</strong>{" "}
                  {work.workDetails || "Not Available"}
                </p>

                <p>
                  <strong>Work Start Date:</strong>{" "}
                  {work.startDate || "Not Updated"}
                </p>

                <p>
                  <strong>Work End Date:</strong>{" "}
                  {work.endDate || "Not Updated"}
                </p>

                <p>
                  <strong>Allotment Date:</strong> {work.date || "N/A"}
                </p>
              </div>

              <div className="workDetailBox">
                <h4>Materials Used</h4>

                {relatedMaterials.length === 0 ? (
                  <p>No material details updated yet.</p>
                ) : (
                  relatedMaterials.map((material) => (
                    <div key={material.id} className="materialMiniCard">
                      <p>
                        <strong>Material:</strong> {material.materialName}
                      </p>

                      <p>
                        <strong>Quantity:</strong> {material.quantity}
                      </p>

                      <p>
                        <strong>Used By:</strong> {material.usedBy}
                      </p>

                      <p>
                        <strong>Date:</strong> {material.date}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}