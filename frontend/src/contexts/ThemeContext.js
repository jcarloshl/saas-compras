import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { aPalette } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('cesta_dark') === '1');
  const T = useMemo(() => aPalette(dark), [dark]);

  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem('cesta_dark', next ? '1' : '0');
      return next;
    });
  };

  useEffect(() => {
    document.body.style.background = T.cream;
  }, [T.cream]);

  return (
    <ThemeContext.Provider value={{ T, dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
