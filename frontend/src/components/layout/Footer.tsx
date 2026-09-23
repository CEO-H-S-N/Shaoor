import React from "react";
import Link from "next/link";
import Image from "next/image";
import { GitBranch, X as XIcon, Mail } from "lucide-react";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <Image
                src="/shaoor-logo.png"
                alt="Shaoor"
                width={100}
                height={77}
                className={styles.footerLogoImg}
              />
            </div>
            <p className={styles.footerDescription}>
              An open-access academic paper review and publication platform.
              Empowering researchers to share knowledge and advance science
              through rigorous peer review.
            </p>
          </div>

          {/* Platform */}
          <div className={styles.footerColumn}>
            <h4>Platform</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/papers">Browse Papers</Link></li>
              <li><Link href="/submit">Submit a Paper</Link></li>
              <li><Link href="/about">About Shaoor</Link></li>
              <li><Link href="/guidelines">Author Guidelines</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className={styles.footerColumn}>
            <h4>Resources</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/review-process">Review Process</Link></li>
              <li><Link href="/ethics">Publication Ethics</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className={styles.footerColumn}>
            <h4>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/accessibility">Accessibility</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Shaoor.org. All rights reserved.</span>
          <div className={styles.footerSocial}>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <XIcon size={18} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <GitBranch size={18} />
            </a>
            <a href="mailto:contact@shaoor.org" aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
