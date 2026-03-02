"use client";

import { useTheme } from "../contexts/ThemeContext";

export const useDarkModeMap = () => {
  const { theme } = useTheme();
  
  // Different tile URLs for light and dark modes
  const lightTiles = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  
  return theme === 'dark' ? darkTiles : lightTiles;
};
