"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layout, User, Globe } from "lucide-react";
import Link from "next/link";
import { projectService } from "@/services/project.service";
import styles from "./new-project.module.css";

type ProjectType = "SOFTWARE_DEVELOPMENT" | "CREATIVE_MARKETING" | "ARCHITECTURE" | "CONSULTING" | "OTHER";

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    projectType: "SOFTWARE_DEVELOPMENT" as ProjectType,
    currency: "USD",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);

    console.log("[NEW_PROJECT_PAGE] Submitting form with data:", formData);

    try {
      const data = await projectService.create({
        name: formData.name,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientCompany: formData.clientCompany || undefined,
        projectType: formData.projectType,
        currency: formData.currency,
      });

      console.log("[NEW_PROJECT_PAGE] Received API response:", data);

      if (data.error) {
        setError(data.error.message || "Failed to create project.");
      } else if (data.result?.data) {
        router.push(`/projects/${data.result.data.id}`);
      } else {
        setError("An unexpected response was received from the server.");
      }
    } catch (err: any) {
      console.error("[NEW_PROJECT_PAGE] Communication error:", err);
      setError("Failed to communicate with the project creation server.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/dashboard" className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <h1 className={styles.title}>New Project</h1>
            <p className={styles.subtitle}>Set up a new scope board for your client work.</p>
          </div>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={pending}
            >
              {pending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.formCards}>
          <div className={`${styles.card} ${styles.formCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Layout size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Project Details</h2>
                <p className={styles.cardDescription}>Give your project a name and type</p>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Project Name</label>
              <div className={styles.inputWrapper}>
                <Layout size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Project Type</label>
              <div className={styles.inputWrapper}>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value as ProjectType })}
                  className={styles.select}
                >
                  <option value="SOFTWARE_DEVELOPMENT">Software Development</option>
                  <option value="CREATIVE_MARKETING">Creative & Marketing</option>
                  <option value="ARCHITECTURE">Architecture</option>
                  <option value="CONSULTING">Consulting</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.formCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <User size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Client Information</h2>
                <p className={styles.cardDescription}>Who are you working with?</p>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contact Name</label>
              <div className={styles.inputWrapper}>
                <User size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className={styles.input}
                  style={{ paddingLeft: "14px" }}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Company (Optional)</label>
              <div className={styles.inputWrapper}>
                <Globe size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.clientCompany}
                  onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.currencyCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>$</span>
              </div>
              <div>
                <h2 className={styles.cardTitle}>Currency</h2>
                <p className={styles.cardDescription}>Set the billing currency for this project</p>
              </div>
            </div>

            <div className={styles.field}>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className={styles.selectSmall}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
