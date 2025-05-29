import { createContext, useState } from "react";

export const authContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isSignIn, setIsSignIn] = useState(false);

  return (
    <authContext.Provider value={{ isSignIn, setIsSignIn }}>
      {children}
    </authContext.Provider>
  );
}
