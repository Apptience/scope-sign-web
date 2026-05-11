import Link from "next/link";
import { 
  FileText, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldCheck,
  Layers,
  Sparkles
} from "lucide-react";
import styles from "./page.module.css";

export const metadata = {
  title: "ScopeSign | The Visual Scope Truth",
  description: "Convert your SOWs into visual scope boards that clients can review and approve before development starts.",
};

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.heroBg} aria-hidden="true" />
      
      {/* Sticky Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Layers size={16} strokeWidth={2.5} />
          </div>
          <span>ScopeSign</span>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.navLink}>
            Log in
          </Link>
          <Link href="/signup" className={`${styles.primaryBtn} ${styles.navBtn}`}>
            Get Access
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.badge}>
            <Sparkles size={12} style={{ marginRight: 6 }} />
            NOW IN PRIVATE BETA
          </div>
          <h1 className={styles.title}>
            Eliminate scope creep <br />
            <span className={styles.gradientText}>by design.</span>
          </h1>
          <p className={styles.subtitle}>
            Turn static contracts into interactive visual boards. Give non-technical clients the clarity they need to sign off with absolute confidence.
          </p>
          
          <div className={styles.ctaGroup}>
            <Link href="/signup" className={styles.primaryBtn}>
              Start Free Trial
            </Link>
            <Link href="/login" className={styles.secondaryBtn}>
              View Demo
            </Link>
          </div>
        </section>

        {/* The Process Grid */}
        <section className={styles.gridSection}>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <FileSpreadsheet size={22} strokeWidth={2} />
              </div>
              <h3 className={styles.cardTitle}>Structure Fast</h3>
              <p className={styles.cardDesc}>
                Map your Statement of Work into digestible, clear visual cards. Stop writing essays that clients never fully digest.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <Eye size={22} strokeWidth={2} />
              </div>
              <h3 className={styles.cardTitle}>Define Boundries</h3>
              <p className={styles.cardDesc}>
                Explicitly declare what is and isn't included inside each card. Eradicate gray areas where disputes thrive.
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <h3 className={styles.cardTitle}>Lock In Approval</h3>
              <p className={styles.cardDesc}>
                Collect crystal-clear sign-offs. Every post-launch request becomes a paid change order effortlessly.
              </p>
            </div>
          </div>
        </section>

        {/* Solution Split */}
        <section className={styles.splitSection}>
          <div className={styles.splitContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Bridge the gap between <br/> expectation & reality
              </h2>
              <p className={styles.sectionDesc}>
                Clients cannot "visualise" features from 12-page technical docs. ScopeSign provides visual certainty that removes ambiguity.
              </p>
              
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <CheckCircle2 className={styles.check} size={18} strokeWidth={3} />
                  <span>Single source of truth for MVP scope</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 className={styles.check} size={18} strokeWidth={3} />
                  <span>Passwordless client review link</span>
                </div>
                <div className={styles.featureItem}>
                  <CheckCircle2 className={styles.check} size={18} strokeWidth={3} />
                  <span>Threaded Q&A directly inside features</span>
                </div>
              </div>
            </div>

            <div className={styles.mockupWrapper}>
              <div className={styles.mockupCard}>
                <div className={styles.mockupHeader}>
                  <h4 className={styles.mockupTitle}>Stripe Integration</h4>
                  <span className={styles.mockupStatus}>Active</span>
                </div>
                
                <p className={styles.mockupDesc}>
                  Process credit card transactions via native API direct to client bank account.
                </p>
                
                <div className={`${styles.mockupBadge} ${styles.mockupIncluded}`}>
                  <CheckCircle2 size={14} /> INCLUDED
                </div>
                <div className={`${styles.mockupList} ${styles.mockupListIncluded}`}>
                  Credit card forms • Single charge capture
                </div>

                <div className={`${styles.mockupBadge} ${styles.mockupExcluded}`}>
                  <div style={{width: 14, textAlign: 'center', fontWeight: 800}}>×</div> EXCLUDED
                </div>
                <div className={`${styles.mockupList} ${styles.mockupListExcluded}`}>
                  Recurring cycles • Metered usage billing
                </div>
              </div>
              
              <div className={styles.mockupCallout}>
                🎯 Clients Approve Individual Feature Boundaries
              </div>
            </div>
          </div>
        </section>

        {/* Final Action Section */}
        <section className={styles.bottomCta}>
          <div className={styles.bottomCtaBg} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 className={styles.sectionTitle} style={{ maxWidth: 600, margin: '0 auto 24px' }}>
              Stop leaking margin to unspoken expectations.
            </h2>
            <p className={styles.subtitle} style={{ maxWidth: 540 }}>
              Deliver on exactly what was promised. Sign up today and regain control of your profitability.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/signup" className={styles.primaryBtn} style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                Build First Scope <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.logo} style={{ opacity: 0.7 }}>
            <div className={styles.logoIcon} style={{ width: 24, height: 24, opacity: 0.8 }}>
              <Layers size={12} />
            </div>
            <span style={{ fontSize: '1rem' }}>ScopeSign</span>
          </div>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} ScopeSign. Elevating Agency Delivery.
          </p>
        </div>
      </footer>
    </div>
  );
}
