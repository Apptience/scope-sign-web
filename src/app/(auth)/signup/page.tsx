"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, FileText, Shield, DollarSign, Clock, CheckCircle } from "lucide-react";
import { authService } from "@/services/auth.service";
import styles from "../auth.module.css";

const testimonials = [
  {
    quote: `ScopeSign eliminated scope creep from our agency. We recovered $50k in unbilled work last quarter alone.`,
    name: "Marcus Chen",
    role: "Founder, Pixelcraft Studio",
    initials: "MC",
  },
];

const features = [
  { icon: Shield, text: "Define project boundaries clearly" },
  { icon: DollarSign, text: "Track change requests and extras" },
  { icon: Clock, text: "Auto-enforce timeline protections" },
  { icon: CheckCircle, text: "Get client sign-offs that hold up" },
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    agencyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        agencyName: formData.agencyName,
      });

      if (data.error) {
        setError(data.error.message || "Something went wrong during signup.");
      } else if (data.result?.data) {
        if (data.result.data.needsVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
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
      <div className={styles.splitLayout}>
        <div className={styles.leftPanel}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <FileText size={18} strokeWidth={2} />
            </div>
            <span className={styles.logoText}>ScopeSign</span>
          </div>

          <div className={styles.ctaSection}>
            <h1 className={styles.ctaTitle}>
              Protect your revenue from <span>scope creep</span>
            </h1>
            <p className={styles.ctaSubtitle}>
              Stop leaving money on the table. Get formalized project boundaries that actually work.
            </p>

            <div className={styles.ctaFeatures}>
              {features.map((feature, i) => (
                <div key={i} className={styles.ctaFeature}>
                  <div className={styles.ctaFeatureIcon}>
                    <feature.icon size={14} strokeWidth={2.5} />
                  </div>
                  <span className={styles.ctaFeatureText}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.testimonialsSection}>
            {testimonials.map((testimonial, i) => (
              <div key={i} className={styles.testimonial}>
                <p className={styles.testimonialQuote}>{`"${testimonial.quote}"`}</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{testimonial.initials}</div>
                  <div className={styles.testimonialInfo}>
                    <span className={styles.testimonialName}>{testimonial.name}</span>
                    <span className={styles.testimonialRole}>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <span className={styles.formLabel}>Start with ScopeSign</span>
              <h2 className={styles.formTitle}>Create agency account</h2>
              <p className={styles.formSubtitle}>Manage projects, track scope, and get paid what you&apos;re owed.</p>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aalpha"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pawan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="hello@agency.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.togglePassword}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className={styles.footer}>
              <span className={styles.footerText}>Already have an account? </span>
              <Link href="/login" className={styles.footerLink}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
