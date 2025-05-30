import { createContext, useState } from "react";

export const authContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [role, setRole] = useState(null);

  return (
    <authContext.Provider value={{ isSignIn, setIsSignIn, role, setRole }}>
      {children}
    </authContext.Provider>
  );
}
