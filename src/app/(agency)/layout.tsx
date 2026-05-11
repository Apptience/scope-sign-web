import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import styles from "./agency-layout.module.css";

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>
      <div className={styles.mainContainer}>
        <Topbar />
        <main className={styles.main}>
          <div className={styles.contentWrapper}>
            <div className={styles.contentInner}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
