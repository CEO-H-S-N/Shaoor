"use client";

import React from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  href?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  iconOnly = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    isLoading ? styles.loading : "",
    fullWidth ? styles.fullWidth : "",
    iconOnly ? styles.iconOnly : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
