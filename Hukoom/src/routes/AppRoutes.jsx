import { Routes, Route } from "react-router-dom";

// import Landing from "../pages/Landing";
import About from "../pages/About";
import Home from "../pages/Home";
import Contact from "../pages/Contact";

function AppRoutes() {
  return (
    <Routes>    
      <Route path="/about" element={<About />} />      
      <Route path="/home" element={<Home />} />    
      <Route path="/contact" element={<Contact/>}/>
    </Routes>
  );
}

export default AppRoutes;