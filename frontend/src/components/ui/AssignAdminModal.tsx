"use client";

import React, { useState, useEffect } from "react";
import styles from "./AssignAdminModal.module.css";
import { UserCheck, X, Shield, Search } from "lucide-react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AssignAdminModalProps {
  isOpen: boolean;
  paperId: string;
  paperTitle: string;
  currentAssignedId?: string | null;
  onClose: () => void;
  onAssigned: (paperId: string, assignedAdmin: { id: string; name: string | null; email: string } | null) => void;
}

export function AssignAdminModal({
  isOpen,
  paperId,
  paperTitle,
  currentAssignedId,
  onClose,
  onAssigned,
}: AssignAdminModalProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(currentAssignedId ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedAdminId(currentAssignedId ?? null);
      fetchAdmins();
    }
  }, [isOpen, currentAssignedId]);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?role=ADMIN");
      const data = await res.json();
      if (res.ok && data.users) {
        setAdmins(data.users);
      }
    } catch {
      setError("Failed to load administrators.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/papers/${paperId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignToUserId: selectedAdminId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign paper");

      const chosen = admins.find((a) => a.id === selectedAdminId) || null;
      onAssigned(paperId, chosen);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  }

  const filteredAdmins = admins.filter(
    (a) =>
      (a.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <UserCheck size={20} />
          </div>
          <div className={styles.headerText}>
            <h3>Assign Manuscript Reviewer</h3>
            <p className={styles.paperTitle} title={paperTitle}>
              {paperTitle}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.instruction}>
            Select an administrator from the board to assign this paper to their dedicated queue.
          </p>

          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search admin by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {error && <div className={styles.errorNotice}>{error}</div>}

          <div className={styles.adminList}>
            {/* Unassign option */}
            <div
              className={`${styles.adminItem} ${selectedAdminId === null ? styles.selected : ""}`}
              onClick={() => setSelectedAdminId(null)}
            >
              <div className={styles.radio}>
                {selectedAdminId === null && <div className={styles.radioDot} />}
              </div>
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>Unassigned</span>
                <span className={styles.adminEmail}>Leave paper open for any master review</span>
              </div>
            </div>

            {loading ? (
              <div className={styles.loading}>Loading administrator accounts...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className={styles.empty}>No matching administrators found</div>
            ) : (
              filteredAdmins.map((admin) => (
                <div
                  key={admin.id}
                  className={`${styles.adminItem} ${selectedAdminId === admin.id ? styles.selected : ""}`}
                  onClick={() => setSelectedAdminId(admin.id)}
                >
                  <div className={styles.radio}>
                    {selectedAdminId === admin.id && <div className={styles.radioDot} />}
                  </div>
                  <div className={styles.adminInfo}>
                    <div className={styles.nameRow}>
                      <span className={styles.adminName}>{admin.name || "Administrator"}</span>
                      <span className={styles.roleBadge}>
                        <Shield size={11} /> {admin.role}
                      </span>
                    </div>
                    <span className={styles.adminEmail}>{admin.email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
