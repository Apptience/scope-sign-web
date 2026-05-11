"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import styles from "./not-found.module.css";

export default function NotFound() {
  const [destination, setDestination] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        setDestination("/dashboard");
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Compass size={48} className={styles.compassIcon} />
        </div>
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.heading}>You've hit static space.</h2>
        <p className={styles.text}>
          The page you are looking for doesn't exist or has navigated somewhere else. 
          Let's orbit back.
        </p>
        <Link href={destination} className={styles.homeBtn}>
          <ArrowLeft size={16} />
          <span>Return to Base</span>
        </Link>
      </div>
    </div>
  );
}
