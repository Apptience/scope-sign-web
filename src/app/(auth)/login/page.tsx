"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, FileText } from "lucide-react";
import { authService } from "@/services/auth.service";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authService.login({ email, password });

      if (data.error) {
        setError(data.error.message || "Invalid email or password");
      } else if (data.result?.data) {
        if (data.result.data.needsVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        const { token, user, agency } = data.result.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("agency", JSON.stringify(agency));
        router.push("/dashboard");
      } else {
        setError("An unexpected response was received from the server.");
      }
    } catch (err: any) {
      setError("Failed to connect to the authentication server. Please ensure the backend is running on port 4000.");
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
          <span className={styles.headerLabel}>Agency Access</span>
          <h1 className={styles.headerTitle}>Log in</h1>
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
          </div>

          <div className={styles.field}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Password</label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={loading}>
            {loading ? "Logging in..." : "Log in to Dashboard"}
          </button>
        </form>

        <p className={styles.footer}>
          <span className={styles.footerText}>Don&apos;t have an account? </span>
          <Link href="/signup" className={styles.footerLink}>Sign up</Link>
        </p>
      </div>
    </main>
  );
}
