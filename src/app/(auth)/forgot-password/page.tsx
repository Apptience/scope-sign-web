"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.forgotPassword(email);

      if (data.error) {
        setError(data.error.message || "Failed to process request");
      } else {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo} style={{ justifyContent: "center", marginBottom: "24px" }}>
          <div className={styles.logoIcon}>
            <FileText size={18} strokeWidth={2} />
          </div>
          <span className={styles.logoText}>ScopeSign</span>
        </div>

        <div className={styles.header}>
          <span className={styles.headerLabel}>Account Recovery</span>
          <h1 className={styles.headerTitle}>Reset Password</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.formSingle} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Work Email</label>
            <input
              type="email"
              required
              placeholder="hello@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--muted-foreground)" }}>
              We'll send a 6-digit verification code to this email.
            </p>
          </div>

          <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <p className={styles.footer} style={{ marginTop: "24px" }}>
          <Link href="/login" className={styles.footerLink} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={14} /> Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
