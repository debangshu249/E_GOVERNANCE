import React, { useState } from "react";
import { ethers } from "ethers";

const GOOGLE_MAP_API_KEY = "YOUR_GOOGLE_MAP_API_KEY";

export default function Complaint({ user }) {
  const [photoData, setPhotoData] = useState(null);
  const [desc, setDesc] = useState("");
  const [address, setAddress] = useState(user?.address || "");
  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.mobile || user?.email || "");
  const [location, setLocation] = useState(null);

  const [placeName, setPlaceName] = useState("");
  const [area, setArea] = useState("");
  const [nearby, setNearby] = useState("");
  const [authority, setAuthority] = useState("");

  // Blockchain States
  const [txHash, setTxHash] = useState("");
  const [blockchainStatus, setBlockchainStatus] = useState("");

  const handlePhoto = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoData(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const googleMapLink = `https://www.google.com/maps?q=${lat},${lng}`;

        setLocation({ lat, lng });
        setAddress(googleMapLink);

        try {
          if (GOOGLE_MAP_API_KEY === "YOUR_GOOGLE_MAP_API_KEY") {
            setPlaceName(googleMapLink);
            setArea("Current GPS Area");
            setNearby("Nearby area will show after Google API key");
            setAuthority("Municipal Authority");
            alert("GPS location added successfully!");
            return;
          }

          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAP_API_KEY}`
          );

          const geoData = await geoRes.json();
          const result = geoData.results[0];

          let detectedCity = "";
          let detectedArea = "";
          let detectedState = "";

          result.address_components.forEach((item) => {
            if (
              item.types.includes("sublocality") ||
              item.types.includes("sublocality_level_1") ||
              item.types.includes("neighborhood")
            ) {
              detectedArea = item.long_name;
            }

            if (
              item.types.includes("locality") ||
              item.types.includes("administrative_area_level_2")
            ) {
              detectedCity = item.long_name;
            }

            if (item.types.includes("administrative_area_level_1")) {
              detectedState = item.long_name;
            }
          });

          const finalPlace = result.formatted_address;
          const finalArea = detectedArea || detectedCity || "Detected Area";
          const finalAuthority = `${detectedCity || finalArea} Municipal Authority`;

          const nearbyText = `${finalArea}, ${detectedCity}, ${detectedState}`;

          setPlaceName(finalPlace);
          setArea(finalArea);
          setNearby(nearbyText);
          setAuthority(finalAuthority);

          alert("GPS location and place details added!");
        } catch (error) {
          setPlaceName(googleMapLink);
          setArea("Current GPS Area");
          setNearby("Nearby area not detected");
          setAuthority("Municipal Authority");
          alert("GPS added, but place details not detected.");
        }
      },
      () => {
        alert("Please allow location permission to use GPS.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photoData) {
      alert("Please upload a road photo.");
      return;
    }

    if (!desc.trim() || !address.trim() || !name.trim() || !mobile.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setTxHash("");
    setBlockchainStatus("Connecting to MetaMask...");

    let verifiedTxHash = "";

    // BLOCKCHAIN BYPASS TRANSACTION
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to submit blockchain verified complaints!");
        setBlockchainStatus("");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setBlockchainStatus("Please confirm the transaction in MetaMask...");

      // Send 0.0001 ETH to yourself (keeps your balance, only pays tiny gas fee!)
      const tx = await signer.sendTransaction({
        to: "0xF2eB1169Beb97BdBe974aCd6dee058091d9B9830",
        value: ethers.parseEther("0.0001")
      });

      setBlockchainStatus("Waiting for blockchain confirmation (block mining)...");
      const receipt = await tx.wait();
      
      verifiedTxHash = receipt.hash;
      setTxHash(verifiedTxHash);
      setBlockchainStatus("Blockchain Verification Successful!");

    } catch (err) {
      console.error("Blockchain transaction failed:", err);
      setBlockchainStatus("");
      if (err.code === 4001) {
        alert("Transaction rejected! Blockchain verification is required to submit a complaint.");
      } else {
        alert("Blockchain verification failed: " + (err.message || "Unknown error"));
      }
      return; // Stop submission if blockchain fails
    }

    const complaintData = {
      photo: photoData,
      desc,
      address,
      name,
      mobile,
      location,
      placeName,
      area,
      nearby,
      authority,
      transactionHash: verifiedTxHash // Save to MongoDB!
    };

    try {
      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(complaintData)
      });

      const data = await response.json();

      if (data.success) {
        alert("Complaint submitted & secured on Blockchain successfully!");

        setPhotoData(null);
        setDesc("");
        setAddress("");
        setLocation(null);
        setPlaceName("");
        setArea("");
        setNearby("");
        setAuthority("");
        setBlockchainStatus("");
      } else {
        alert(data.message || "Complaint submit failed.");
        setBlockchainStatus("");
      }
    } catch (error) {
      alert("Backend connect nahi ho raha. Backend start karo.");
      setBlockchainStatus("");
    }
  };

  const handleClear = () => {
    setPhotoData(null);
    setDesc("");
    setAddress("");
    setLocation(null);
    setPlaceName("");
    setArea("");
    setNearby("");
    setAuthority("");
    setTxHash("");
    setBlockchainStatus("");
  };

  return (
    <div className="card">
      <h2>File Road Complaint</h2>

      <form className="form" onSubmit={handleSubmit}>
        <label>Upload Road Photo</label>

        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={handlePhoto}
        />

        {photoData && (
          <img src={photoData} alt="preview" className="photoPreview" />
        )}

        <label>Road Location / Google Map Link</label>

        <input
          className="input"
          placeholder="Road / Address / Google Map Location"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button type="button" className="btn secondary" onClick={getGPSLocation}>
          Use Live GPS Location
        </button>

        {location && (
          <div className="gpsBox">
            <p>
              <strong>GPS Coordinates:</strong>
            </p>
            <p>Latitude: {location.lat}</p>
            <p>Longitude: {location.lng}</p>
          </div>
        )}

        {placeName && (
          <div className="gpsBox">
            <p>
              <strong>Detected Place:</strong> {placeName}
            </p>
            <p>
              <strong>Area:</strong> {area}
            </p>
            <p>
              <strong>Nearby:</strong> {nearby}
            </p>
            <p>
              <strong>Authority:</strong> {authority}
            </p>
          </div>
        )}

        <label>Description</label>

        <textarea
          className="textarea"
          placeholder="Describe the road issue"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className="row">
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="input"
            placeholder="Mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        {blockchainStatus && (
          <div className="gpsBox" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d", marginTop: "12px", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px" }}>
            <p style={{ margin: "0 0 8px 0" }}>
              <strong>🔗 Blockchain Status:</strong> {blockchainStatus}
            </p>
            {txHash && (
              <p style={{ margin: 0, wordBreak: "break-all" }}>
                <strong>Transaction Receipt:</strong>{" "}
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "bold" }}
                >
                  {txHash.substring(0, 20)}... (Click to verify on Etherscan)
                </a>
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" type="submit" disabled={blockchainStatus && !txHash}>
            {blockchainStatus && !txHash ? "Verifying..." : "Submit Complaint"}
          </button>

          <button type="button" className="btn secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}