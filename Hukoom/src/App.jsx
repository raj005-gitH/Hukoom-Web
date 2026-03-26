import { useState } from "react";
import Landing from "./Landing";

function App() {
  const [role, setRole] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    console.log("Selected role:", selectedRole);
  };

  return (
    <>
      {!role && <Landing onSelectRole={handleRoleSelect} />}      
      {role === "user" && <h1>User Login Page</h1>}
      {role === "hero" && <h1>Hero Login Page</h1>}            
    </>
  );
}

export default App;