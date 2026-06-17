import React, { useState } from "react";

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
      authority
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
        alert("Complaint submitted successfully!");

        setPhotoData(null);
        setDesc("");
        setAddress("");
        setLocation(null);
        setPlaceName("");
        setArea("");
        setNearby("");
        setAuthority("");
      } else {
        alert(data.message || "Complaint submit failed.");
      }
    } catch (error) {
      alert("Backend connect nahi ho raha. Backend start karo.");
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

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn" type="submit">
            Submit Complaint
          </button>

          <button type="button" className="btn secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}