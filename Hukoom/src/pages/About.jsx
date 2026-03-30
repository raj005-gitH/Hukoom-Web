import "./About.css";

function About() {
  return (
    <div className="about-container">

      {/* HERO SECTION */}
      <section className="about-hero">
        <h1>About Hukoom</h1>
        <p>
          Connecting you with trusted local service providers—fast, reliable, and hassle-free.
        </p>
      </section>

      {/* MISSION SECTION */}
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Hukoom aims to simplify everyday life by helping people find verified
          professionals for their daily needs—whether it's fixing a tap, cleaning
          your home, or handling urgent repairs.
        </p>
      </section>

      {/* VISION SECTION */}
      <section className="about-section">
        <h2>Our Vision</h2>
        <p>
          To become India's most trusted platform for connecting users with
          reliable service providers while empowering local workers with more opportunities.
        </p>
      </section>

      {/* SERVICES SECTION */}
      <section className="about-section">
        <h2>What We Offer</h2>
        <ul>
          <li>✔ Verified Service Providers</li>
          <li>✔ Transparent Pricing</li>
          <li>✔ Easy Booking System</li>
          <li>✔ Wide Range of Services</li>
        </ul>
      </section>

      {/* WHY US SECTION */}
      <section className="about-section">
        <h2>Why Choose Hukoom?</h2>
        <p>
          We focus on trust, convenience, and quality. Every service provider is
          verified, and every booking is designed to be seamless and secure.
        </p>
      </section>

      {/* CTA SECTION */}
      <section className="about-cta">
        <h2>Ready to get started?</h2>
        <button>Explore Services</button>
      </section>

    </div>
  );
}

export default About;