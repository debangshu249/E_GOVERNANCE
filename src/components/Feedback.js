import React, { useState } from "react";

export default function Feedback({ user }) {
  const [name, setName] = useState(user?.name || "");
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !rating || !review) {
      alert("Please fill all fields.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/feedbacks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        rating,
        review
      })
    });

    const data = await response.json();

    if (data.success) {
      alert("Feedback submitted successfully!");

      setName("");
      setRating("");
      setReview("");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="pageBox">
      <h2>Public Feedback</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">Select Rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Very Poor</option>
        </select>

        <textarea
          placeholder="Write your feedback..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <button type="submit">Submit Feedback</button>
      </form>
    </div>
  );
}