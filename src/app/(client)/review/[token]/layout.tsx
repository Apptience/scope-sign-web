"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientService, BoardData } from "../../../../services/client.service";
import styles from "./layout.module.css";

export default function ClientReviewLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const token = params?.token as string;
  const [agencyName, setAgencyName] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ClientService.getBoard(token)
      .then(data => {
        if (data.agency?.name) {
          setAgencyName(data.agency.name);
        }
      })
      .catch(() => {
        // fail silently for layout
      });
  }, [token]);

  return (
    <div className={styles.clientLayout}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          ScopeSign
          {agencyName && (
            <span className={styles.agencyBadge}>for {agencyName}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          Client Workspace
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
