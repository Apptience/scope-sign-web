"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";
import styles from "../auth.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.resetPassword({
        email: initialEmail,
        code,
        newPassword,
      });

      if (data.error) {
        setError(data.error.message || "Invalid or expired reset code");
      } else {
        router.push("/login?reset=success");
      }
    } catch (err: any) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Account Recovery</span>
        <h1 className={styles.headerTitle}>New Password</h1>
      </div>

      <p style={{ textAlign: "center", fontSize: "14px", color: "var(--muted-foreground)", marginBottom: "24px" }}>
        Enter the 6-digit code sent to <strong>{initialEmail}</strong> and your new password.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.formSingle} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Reset Code</label>
          <input
            type="text"
            required
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={styles.input}
            style={{ letterSpacing: "4px", textAlign: "center", fontSize: "18px", fontWeight: "600" }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>New Password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`${styles.input} ${styles.inputWithIcon}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.togglePassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Confirm New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
          />
        </div>

        <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={loading || !initialEmail}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo} style={{ justifyContent: "center", marginBottom: "24px" }}>
          <div className={styles.logoIcon}>
            <FileText size={18} strokeWidth={2} />
          </div>
          <span className={styles.logoText}>ScopeSign</span>
        </div>

        <Suspense fallback={<p style={{ textAlign: "center" }}>Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
