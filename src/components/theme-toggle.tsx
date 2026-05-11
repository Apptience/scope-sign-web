"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span className={styles.track}>
        <span className={`${styles.knob} ${theme === "dark" ? styles.dark : ""}`}>
          {theme === "light" ? (
            <Sun size={14} strokeWidth={2.5} />
          ) : (
            <Moon size={14} strokeWidth={2.5} />
          )}
        </span>
      </span>
    </button>
  );
}
