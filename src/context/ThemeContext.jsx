import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [modoOscuro, setModoOscuro] = useState(
    localStorage.getItem("modoOscuro") === "true"
  );

  // 🔹 Aplica la clase global al body
  useEffect(() => {
    document.body.classList.toggle("dark-mode", modoOscuro);
    localStorage.setItem("modoOscuro", modoOscuro);
  }, [modoOscuro]);

  return (
    <ThemeContext.Provider value={{ modoOscuro, setModoOscuro }}>
      {children}
    </ThemeContext.Provider>
  );
};
