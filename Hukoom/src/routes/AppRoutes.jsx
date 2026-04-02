import { Routes, Route } from "react-router-dom";

// import Landing from "../pages/Landing";
import About from "../pages/About";
import Home from "../pages/Home";
import Contact from "../pages/Contact";
import Profile from "../pages/Profile";
import AIAgent from "../pages/AIAgent";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/aiagent" element={<AIAgent />} />
    </Routes>
  );
}

export default AppRoutes;
