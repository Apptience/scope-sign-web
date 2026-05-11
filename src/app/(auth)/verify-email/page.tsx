"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import styles from "../auth.module.css";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    console.log("[VERIFY_EMAIL_PAGE] Mounted. Email search parameter:", email);
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [email]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split("");
    setOtp(digits);

    // Focus last input
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const code = otp.join("");
    console.log("[VERIFY_EMAIL_PAGE] Submitting OTP:", code, "for email:", email);
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.verifyOtp({ email, code });
      console.log("[VERIFY_EMAIL_PAGE] verifyOtp response data:", data);

      if (data.error) {
        setError(data.error.message || "Invalid or expired verification code.");
      } else if (data.result?.data) {
        const { token, user, agency } = data.result.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("agency", JSON.stringify(agency));

        setSuccess("Account verified successfully!");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError("An unexpected response was received from the server.");
      }
    } catch (err: any) {
      console.error("[VERIFY_EMAIL_PAGE] verifyOtp caught error:", err);
      setError("Failed to connect to the server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    console.log("[VERIFY_EMAIL_PAGE] Resending OTP requested for email:", email);
    if (!email) {
      setError("Email address is missing from the URL parameters.");
      return;
    }
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const data = await authService.resendOtp(email);
      console.log("[VERIFY_EMAIL_PAGE] resendOtp response data:", data);

      if (data.error) {
        setError(data.error.message || "Failed to resend verification code.");
      } else {
        setSuccess("A new verification code has been sent to your email!");
      }
    } catch (err: any) {
      console.error("[VERIFY_EMAIL_PAGE] resendOtp caught error:", err);
      setError("Failed to connect to the server. Please ensure the backend is running.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.logo} style={{ justifyContent: "center", marginBottom: "24px" }}>
        <div className={styles.logoIcon}>
          <FileText size={18} strokeWidth={2} />
        </div>
        <span className={styles.logoText}>ScopeSign</span>
      </div>

      <div className={styles.header}>
        <span className={styles.headerLabel}>Security Verification</span>
        <h1 className={styles.headerTitle}>Verify your email</h1>
        <p className={styles.formSubtitle} style={{ marginTop: "8px", fontSize: "0.875rem" }}>
          We sent a 6-digit verification code to <strong style={{ color: "var(--header-primary)" }}>{email || "your email"}</strong>.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && (
        <p className={styles.error} style={{ background: "rgba(45, 125, 70, 0.1)", color: "var(--status-positive-text)" }}>
          <CheckCircle2 size={16} style={{ marginRight: "8px", display: "inline", verticalAlign: "middle" }} />
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.formSingle}>
        <div className={styles.field}>
          <label className={styles.label} style={{ textAlign: "center", display: "block", marginBottom: "16px" }}>
            Verification Code
          </label>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                ref={(el) => { inputRefs.current[index] = el; }}
                style={{
                  width: "48px",
                  height: "56px",
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  textAlign: "center",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--header-primary)",
                  outline: "none",
                  transition: "all var(--transition-fast)"
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            ))}
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading || otp.some(d => !d)}>
          {loading ? "Verifying..." : "Verify Account"}
        </button>
      </form>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
        <Link href="/login" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.875rem",
            color: "var(--brand)",
            fontWeight: "500",
            cursor: "pointer",
            background: "none",
            border: "none",
            opacity: resending ? 0.7 : 1
          }}
        >
          <RefreshCw size={14} className={resending ? "spin-animation" : ""} />
          {resending ? "Resending..." : "Resend Code"}
        </button>
      </div>

      <style jsx global>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className={styles.container}>
      <Suspense fallback={
        <div className={styles.card} style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading verification panel...</p>
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </main>
  );
}
