"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Briefcase, Calendar, Globe, User } from "lucide-react";
import { projectService } from "@/services/project.service";
import styles from "./projects.module.css";

interface Project {
  id: string;
  name: string;
  clientName: string;
  clientCompany: string | null;
  status: string;
  type: string;
  currency: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadProjects() {
      const startTime = Date.now();
      try {
        const response = await projectService.list();
        
        // Enforce minimum 500ms loading state
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 500 - elapsedTime);
        
        setTimeout(() => {
          if (response.result?.data) {
            setProjects(response.result.data);
          }
          setLoading(false);
        }, remainingTime);

      } catch (error) {
        console.error("Failed to load projects:", error);
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((proj) => 
      proj.name.toLowerCase().includes(query) ||
      proj.clientName.toLowerCase().includes(query) ||
      proj.clientCompany?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>All Projects</h1>
          <p>Manage your client scope boards and active contracts.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/projects/new" className={styles.newProjectBtn}>
            <Plus size={18} />
            Create Project
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name or client..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loading}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonRow}>
                <div className={styles.skeletonCircle} />
                <div className={styles.skeletonBadge} />
              </div>
              <div className={styles.skeletonLine + " " + styles.title} />
              <div className={styles.skeletonLine + " " + styles.subtitle} />
              <div>
                <div className={styles.skeletonLine + " " + styles.meta} />
                <div className={styles.skeletonLine + " " + styles.meta} />
              </div>
              <div className={styles.skeletonFooter}>
                <div className={styles.skeletonLine + " " + styles.footerText} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Briefcase size={32} />
              </div>
              <h3>No projects found</h3>
              <p>{searchQuery ? "Try adjusting your search term." : "Get started by creating your very first client project board."}</p>
              {!searchQuery && (
                <Link href="/projects/new" className={styles.newProjectBtn}>
                  <Plus size={18} />
                  New Project
                </Link>
              )}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <Link 
                href={`/projects/${project.id}`} 
                key={project.id} 
                className={styles.projectCard}
              >
                <div className={styles.cardTop}>
                  <div className={styles.clientBadge}>
                    {getInitials(project.clientCompany || project.clientName)}
                  </div>
                  <span className={`${styles.statusBadge} ${styles[project.status.toLowerCase()] || ''}`}>
                    {project.status.replace("_", " ")}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <span className={styles.clientName}>{project.clientName} {project.clientCompany ? `· ${project.clientCompany}` : ""}</span>
                  
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <Globe size={12} /> {project.type.replace("_", " ")}
                    </div>
                    <div className={styles.metaItem}>
                      <span style={{ fontWeight: 600 }}>{project.currency}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.footerDate}>
                    <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <User size={14} style={{ opacity: 0.5 }} />
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
