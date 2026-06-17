import React, { useEffect, useState } from "react";

export default function AuthorityReviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const response = await fetch("http://localhost:5000/api/reviews");
    const data = await response.json();

    if (data.success) {
      setReviews(data.reviews);
    }
  };

  return (
    <div className="pageBox">
      <h2>Citizen Reviews</h2>

      {reviews.length === 0 ? (
        <p>No reviews available.</p>
      ) : (
        reviews.map((item) => (
          <div key={item.id} className="listCard">
            <p>
              <strong>Name:</strong> {item.name || "Anonymous"}
            </p>
            <p>
              <strong>Rating:</strong> {item.rating || "No Rating"}
            </p>
            <p>
              <strong>Review:</strong> {item.review || "No Review"}
            </p>
            <p>
              <strong>Date:</strong> {item.date || "N/A"}
            </p>
          </div>
        ))
      )}
    </div>
  );
}