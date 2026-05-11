"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import styles from "./sidebar.module.css";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
];

import { useState, useRef, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("agency");
    router.push("/login");
  };

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowConfirm(false);
      }
    }
    if (showConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showConfirm]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <FileText size={18} strokeWidth={2} />
        </div>
        <span className={styles.logoText}>ScopeSign</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <item.icon size={18} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer} ref={popoverRef}>
        {showConfirm && (
          <div className={styles.confirmPopover}>
            <span className={styles.popoverTitle}>Confirm Sign Out?</span>
            <div className={styles.popoverActions}>
              <button 
                className={`${styles.popoverBtn} ${styles.cancelBtn}`}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.popoverBtn} ${styles.confirmBtn}`}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        
        <button
          className={`${styles.signOutBtn} ${showConfirm ? styles.active : ""}`}
          onClick={() => setShowConfirm(!showConfirm)}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
