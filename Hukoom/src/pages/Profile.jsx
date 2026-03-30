import "./Profile.css";

function Profile() {
  return (
    <div className="profile-container">

      {/* HEADER */}
      <div className="profile-header">
        <div className="avatar">👤</div>
        <h2>John Doe</h2>
        <p>johndoe@email.com</p>
        <button className="edit-btn">Edit Profile</button>
      </div>

      {/* INFO SECTION */}
      <div className="profile-section">
        <h3>Account Details</h3>
        <p><strong>Phone:</strong> +91 98765 43210</p>
        <p><strong>Location:</strong> Delhi, India</p>
      </div>

      {/* BOOKINGS SECTION */}
      <div className="profile-section">
        <h3>Recent Bookings</h3>

        <div className="booking-card">
          <p>🔧 Plumbing Service</p>
          <span>Status: Completed</span>
        </div>

        <div className="booking-card">
          <p>⚡ Electrical Repair</p>
          <span>Status: Pending</span>
        </div>
      </div>

      {/* ACTION */}
      <div className="profile-actions">
        <button className="logout-btn">Logout</button>
      </div>

    </div>
  );
}

export default Profile;