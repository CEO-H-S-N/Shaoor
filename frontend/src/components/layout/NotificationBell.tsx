"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  UserCheck,
  CheckCheck,
  ExternalLink,
  X,
} from "lucide-react";
import styles from "./NotificationBell.module.css";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  paperId?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/user/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // 25s polling
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/user/notifications/read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  // Helper for icon based on notification type
  const renderIcon = (type: string) => {
    switch (type) {
      case "PAPER_ACCEPTED":
      case "PAPER_PUBLISHED":
        return <CheckCircle size={15} className={styles.iconSuccess} />;
      case "PAPER_REJECTED":
        return <XCircle size={15} className={styles.iconDanger} />;
      case "REVISION_REQUESTED":
        return <AlertTriangle size={15} className={styles.iconWarning} />;
      case "REVIEWER_ASSIGNED":
        return <UserCheck size={15} className={styles.iconInfo} />;
      case "PAPER_UNDER_REVIEW":
        return <Clock size={15} className={styles.iconInfo} />;
      default:
        return <FileText size={15} className={styles.iconNeutral} />;
    }
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.bellBtn} ${isOpen ? styles.bellBtnActive : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className={styles.unreadChip}>{unreadCount} unread</span>
              )}
            </div>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.markReadBtn}
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={28} className={styles.emptyIcon} />
                <p>No notifications yet</p>
                <span>You will be notified when actions are taken on your papers or account.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.isRead ? styles.unreadItem : ""}`}
                >
                  <div className={styles.itemIcon}>{renderIcon(n.type)}</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemTime}>{formatTimeAgo(n.createdAt)}</span>
                    </div>
                    <p className={styles.itemMessage}>{n.message}</p>
                    {n.paperId && (
                      <Link
                        href={`/papers/${n.paperId}`}
                        className={styles.paperLink}
                        onClick={() => setIsOpen(false)}
                      >
                        View Paper <ExternalLink size={11} />
                      </Link>
                    )}
                  </div>
                  {!n.isRead && <span className={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
