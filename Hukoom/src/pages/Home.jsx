import "./Home.css";

function Home() {
  return (
    <div className="home-container">

      {/* HERO SECTION */}
      <section className="hero">
        <h1>Find Trusted Local Services Instantly</h1>
        <p>Book verified professionals for all your daily needs.</p>

        <div className="hero-buttons">
          <button className="primary-btn">Explore Services</button>
          <button className="secondary-btn">Become a Provider</button>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services">
        <h2>Our Services</h2>

        <div className="service-grid">
          <div className="card">⚡ Electrician</div>
          <div className="card">🚿 Plumber</div>
          <div className="card">🧹 Cleaner</div>
          <div className="card">🔧 Mechanic</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="steps">
        <h2>How It Works</h2>

        <div className="steps-grid">
          <div className="step">
            <h3>1. Choose Service</h3>
            <p>Select the service you need.</p>
          </div>

          <div className="step">
            <h3>2. Book Instantly</h3>
            <p>Schedule at your convenience.</p>
          </div>

          <div className="step">
            <h3>3. Get It Done</h3>
            <p>Trusted professionals at your doorstep.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to get things done?</h2>
        <button className="primary-btn">Get Started</button>
      </section>

    </div>
  );
}

export default Home;