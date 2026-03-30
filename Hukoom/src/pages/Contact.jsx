import "./Contact.css";

function Contact() {
  return (
    <div className="contact-container">

      {/* HERO */}
      <section className="contact-hero">
        <h1>Contact Us</h1>
        <p>We’re here to help. Reach out anytime.</p>
      </section>

      {/* CONTACT FORM */}
      <section className="contact-form-section">
        <h2>Send us a message</h2>

        <form className="contact-form">
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Your Message" rows="5" required></textarea>

          <button type="submit">Send Message</button>
        </form>
      </section>

      {/* CONTACT INFO */}
      <section className="contact-info">
        <h2>Other Ways to Reach Us</h2>
        <p>📧 Email: support@hukoom.com</p>
        <p>📞 Phone: +91 98765 43210</p>
        <p>📍 Location: India</p>
      </section>

    </div>
  );
}

export default Contact;