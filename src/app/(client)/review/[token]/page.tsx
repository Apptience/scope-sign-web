"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientService, BoardData } from "../../../../services/client.service";
import styles from "./page.module.css";
import { Loader2 } from "lucide-react";

export default function ClientLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ClientService.getBoard(token)
      .then((data) => {
        setBoard(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load project scope.");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <Loader2 className={styles.spinner} />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.errorCard}>
          <h2>Link Invalid or Expired</h2>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate features
  const allCards = [...board.scopeCards, ...board.sections.flatMap((s) => s.scopeCards)];
  const inScopeCount = allCards.filter((c) => c.type === "IN_SCOPE").length;

  return (
    <div className="page-shell">
      <div className={styles.landingContent}>
        <h1 className={styles.title}>Welcome to {board.name}</h1>
        <p className={styles.subtitle}>
          Please review the project scope to ensure we are fully aligned before development begins.
        </p>

        <div className={styles.infoBox}>
          {board.agency && (
            <div className={styles.infoRow}>
              <span>Agency</span>
              <strong>{board.agency.name}</strong>
            </div>
          )}
          <div className={styles.infoRow}>
            <span>Client</span>
            <strong>{board.clientName}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Features to review</span>
            <strong>{inScopeCount}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Estimated time</span>
            <strong>About 5-10 minutes</strong>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => router.push(`/review/${token}/board`)}
          style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}
        >
          Review my project scope
        </button>
      </div>
    </div>
  );
}
