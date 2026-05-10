import React, { useEffect, useState } from "react";

export default function AuthorityMaterials() {
  const [materials, setMaterials] = useState([]);

  const [projectName, setProjectName] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [usedBy, setUsedBy] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const response = await fetch("http://localhost:5000/api/materials");
    const data = await response.json();

    if (data.success) {
      setMaterials(data.materials);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();

    if (!projectName || !materialName || !quantity || !usedBy) {
      alert("Please fill all fields.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/materials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectName,
        materialName,
        quantity,
        usedBy
      })
    });

    const data = await response.json();

    if (data.success) {
      alert("Material record added!");

      setProjectName("");
      setMaterialName("");
      setQuantity("");
      setUsedBy("");

      fetchMaterials();
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="pageBox">
      <h2>Materials Used</h2>

      <form onSubmit={handleAddMaterial}>
        <input
          type="text"
          placeholder="Project / Complaint Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Material Name"
          value={materialName}
          onChange={(e) => setMaterialName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <input
          type="text"
          placeholder="Used By / Contractor Name"
          value={usedBy}
          onChange={(e) => setUsedBy(e.target.value)}
        />

        <button type="submit">Add Material</button>
      </form>

      <h3 style={{ marginTop: "25px" }}>Material Records</h3>

      {materials.length === 0 ? (
        <p>No material records.</p>
      ) : (
        materials.map((item) => (
          <div key={item.id} className="listCard">
            <p>
              <strong>Project:</strong> {item.projectName}
            </p>
            <p>
              <strong>Material:</strong> {item.materialName}
            </p>
            <p>
              <strong>Quantity:</strong> {item.quantity}
            </p>
            <p>
              <strong>Used By:</strong> {item.usedBy}
            </p>
            <p>
              <strong>Date:</strong> {item.date}
            </p>
          </div>
        ))
      )}
    </div>
  );
}