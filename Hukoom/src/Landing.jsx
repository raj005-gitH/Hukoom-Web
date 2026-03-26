import "./Landing.css";

export default function Landing({ onSelectRole }) {
  return (
    <div className="landing-container">
      <h1 className="app-title">Hukoom</h1>
      <p className="tagline">Find trusted help near you</p>

      <div className="role-container">
        <div 
          className="role-card"
          onClick={() => onSelectRole("user")}
        >
          <h2>👤 User</h2>
          <p>Book services easily</p>
        </div>

        <div 
          className="role-card"
          onClick={() => onSelectRole("hero")}
        >
          <h2>🛠 Hero</h2>
          <p>Offer your services & earn</p>
        </div>
      </div>
    </div>
  );
}