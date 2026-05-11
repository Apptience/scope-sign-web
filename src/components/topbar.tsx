"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Bell, Check, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { notificationService, NotificationItem } from "../services/notification.service";
import { projectService } from "../services/project.service";
import styles from "./topbar.module.css";

interface TopbarProps {
  showNewButton?: boolean;
}

interface SearchResult {
  result: {
    data: Array<{
      id: string;
      name: string;
      clientName: string;
      status: string;
    }>;
  };
}

export function Topbar({ showNewButton = true }: TopbarProps) {
  const router = useRouter();
  const [initial, setInitial] = useState("A");
  
  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const data = await notificationService.getLatest();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.debug("Notification polling skipped:", err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.name) {
            setInitial(parsed.name.charAt(0).toUpperCase());
          }
        } catch (_) {}
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search Logic
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await projectService.list({ search: searchQuery });
        // Handle service layer wrapper (res.result.data contains the array based on standard wrapper structure)
        const list = res.result?.data || [];
        setSearchResults(list);
        setIsSearchOpen(true);
        setSelectedIndex(list.length > 0 ? 0 : -1);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleNavigate = (id: string) => {
    router.push(`/projects/${id}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetIdx = selectedIndex >= 0 ? selectedIndex : 0;
      if (searchResults[targetIdx]) {
        handleNavigate(searchResults[targetIdx].id);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const toggleNotifications = async () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    
    if (nextState) {
      if (unreadCount > 0) {
        try {
          await notificationService.markAllAsRead();
          setUnreadCount(0);
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
          console.error("Error marking read:", err);
        }
      }
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left} ref={searchRef}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) setIsSearchOpen(true);
            }}
          />
          
          {isSearchOpen && searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.slice(0, 6).map((p, idx) => (
                <div
                  key={p.id}
                  className={`${styles.searchItem} ${idx === selectedIndex ? styles.selected : ""}`}
                  onClick={() => handleNavigate(p.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.searchResultTitle}>{p.name}</div>
                  <div className={styles.searchResultSub}>{p.clientName} • {p.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {showNewButton && (
          <Link href="/projects/new" className={styles.newButton}>
            <Plus size={14} />
            <span>New Project</span>
          </Link>
        )}

        <div className={styles.notifWrapper} ref={popoverRef}>
          <button 
            className={`${styles.bellButton} ${isNotifOpen ? styles.active : ""}`}
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <div className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</div>}
          </button>

          {isNotifOpen && (
            <div className={styles.popover}>
              <div className={styles.popoverHeader}>
                <h3>Notifications</h3>
                {unreadCount === 0 && notifications.length > 0 && (
                  <span className={styles.itemMeta} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} className="text-emerald-500" /> Caught up
                  </span>
                )}
              </div>
              <div className={styles.list}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyState}>No recent activity.</div>
                ) : (
                  notifications.map((n) => (
                    <Link 
                      key={n.id} 
                      href={`/projects/${n.projectId}`}
                      className={`${styles.listItem} ${!n.isRead ? styles.unread : ""}`}
                      onClick={() => setIsNotifOpen(false)}
                    >
                      {n.project?.name && (
                        <div className={styles.projectBadge}>{n.project.name}</div>
                      )}
                      <div className={styles.itemContent}>{n.content}</div>
                      <div className={styles.itemMeta}>{formatTimeAgo(n.createdAt)}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <div className={styles.avatar}>{initial}</div>
      </div>
    </header>
  );
}
