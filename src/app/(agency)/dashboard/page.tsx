"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import Link from "next/link";
import { projectService } from "@/services/project.service";
import styles from "./dashboard.module.css";

interface Project {
  id: string;
  name: string;
  clientName: string;
  status: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await projectService.list();
        if (data.result?.data) {
          setProjects(data.result.data);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {!projects || projects.length === 0 ? (
        <section className={styles.empty}>
          <div className={styles.emptyIcon}>
            <FileText size={32} className="muted" />
          </div>
          <h3>No projects yet</h3>
          <p className="muted">
            Create your first project to start building scope boards for your
            clients.
          </p>
          <Link href="/projects/new" className={styles.createBtn}>
            <FileText size={16} />
            Create First Project
          </Link>
        </section>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Project</span>
            <span>Client</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          <div className={styles.tableBody}>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={styles.tableRow}
              >
                <div className={styles.projectName}>
                  <FileText size={16} className="muted" />
                  <span>{project.name}</span>
                </div>
                <span className={styles.client}>{project.clientName}</span>
                <span className={styles.status}>
                  {formatStatus(project.status)}
                </span>
                <span className={styles.date}>
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatus(status: string): string {
  return status.toLowerCase().replace("_", " ");
}
