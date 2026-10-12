"use client";

import React, { useState } from "react";
import styles from "./PasswordConfirmModal.module.css";
import { Lock, AlertTriangle, X } from "lucide-react";

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export function PasswordConfirmModal({
  isOpen,
  title,
  description = "Please confirm your administrator password to proceed with this action.",
  confirmLabel = "Confirm Action",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required.");
      return;
    }
    setError("");
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${isDestructive ? styles.iconDestructive : styles.iconNormal}`}>
            {isDestructive ? <AlertTriangle size={20} /> : <Lock size={20} />}
          </div>
          <div className={styles.headerText}>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button className={styles.closeBtn} onClick={handleClose} type="button" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="admin-action-password">
              Admin Password Verification
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.fieldIcon} />
              <input
                id="admin-action-password"
                type="password"
                autoFocus
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading}
                required
              />
            </div>
            {error && <span className={styles.errorText}>{error}</span>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.confirmBtn} ${isDestructive ? styles.destructiveBtn : styles.primaryBtn}`}
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
