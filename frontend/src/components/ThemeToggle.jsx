import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme}>
      <span className="theme-toggle__dot" />
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export default ThemeToggle;
