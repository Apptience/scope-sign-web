"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Check, CheckCircle2, Circle, HelpCircle, Loader2, MessageSquare, X, Edit,
  Database, Shield, Layout, Code, Zap, Globe, Users, Settings, Layers 
} from "lucide-react";
import { projectService } from "@/services/project.service";
import styles from "./preview.module.css";

export default function AgencyPreviewBoard() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [showSignOff, setShowSignOff] = useState(false);
  const [activeTab, setActiveTab] = useState<"DETAILS" | "QA">("DETAILS");
  const [crTargetCardId, setCrTargetCardId] = useState<string | null>(null);
  const [crText, setCrText] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await projectService.getById(params.id as string);
        if (data.error) {
          setError(data.error.message || "Failed to load project.");
        } else {
          setProject(data.result?.data);
        }
      } catch (err: any) {
        setError("Error fetching project data.");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [params.id]);

  const handleSimulatedAction = (action: string) => {
    alert(`[PREVIEW MODE] Simulation: "${action}". This matches what the client would interact with.`);
  };

  const renderCardIcon = (iconName: string) => {
    switch (iconName) {
      case "Database": return <Database size={16} />;
      case "Shield": return <Shield size={16} />;
      case "Layout": return <Layout size={16} />;
      case "Code": return <Code size={16} />;
      case "Zap": return <Zap size={16} />;
      case "Globe": return <Globe size={16} />;
      case "MessageSquare": return <MessageSquare size={16} />;
      case "Users": return <Users size={16} />;
      case "Settings": return <Settings size={16} />;
      case "Feature":
      default: return <Layers size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <Loader2 className={styles.spinner} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "var(--status-danger-text)" }}>
        {error || "Project not found"}
      </div>
    );
  }

  const inScopeCards = [
    ...project.scopeCards.filter((c: any) => c.type === "IN_SCOPE"),
    ...project.sections.flatMap((s: any) => s.scopeCards.filter((c: any) => c.type === "IN_SCOPE")),
  ];
  
  const outOfScopeCards = [
    ...project.scopeCards.filter((c: any) => c.type === "OUT_OF_SCOPE"),
    ...project.sections.flatMap((s: any) => s.scopeCards.filter((c: any) => c.type === "OUT_OF_SCOPE")),
  ];

  const approvedCount = inScopeCards.filter((c: any) => c.status === "APPROVED").length;
  const totalInScope = inScopeCards.length;
  const progressPercent = totalInScope === 0 ? 0 : (approvedCount / totalInScope) * 100;
  const isReadyForSignOff = approvedCount === totalInScope && totalInScope > 0;

  const renderCardsGrid = (cards: any[]) => {
    if (cards.length === 0) return null;
    return (
      <div className={styles.grid}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            className={`${styles.scopeCard} ${styles[card.type.toLowerCase()]} ${styles[card.status.toLowerCase()]}`}
            onClick={() => {
              setSelectedCard(card);
              setIsQuestionMode(false);
              setActiveTab("DETAILS");
            }}
          >
            <div className={styles.cardTop}>
              <span className={styles.cardIcon}>{renderCardIcon(card.icon)}</span>
              <span className={`${styles.cardStatusBadge} ${styles[card.type === 'OUT_OF_SCOPE' ? 'out_of_scope' : card.status.toLowerCase()]}`}>
                {card.type === 'OUT_OF_SCOPE' ? 'Out of Scope' : card.status.replace("_", " ")}
              </span>
            </div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDesc}>{card.description}</p>
            
            <div className={styles.cardBottom}>
              {card.effort ? (
                <span className={styles.cardEffort}>Effort: {card.effort}</span>
              ) : <span />}
              
              {card.type === "IN_SCOPE" && card.status === "APPROVED" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {project?.status !== "SIGNED" && (
                    <button 
                      className={styles.undoBtn} 
                      onClick={(e) => { e.stopPropagation(); handleSimulatedAction("Undo Approval"); }}
                    >
                      Undo Approval
                    </button>
                  )}
                  <button 
                    className={styles.changeBtn} 
                    onClick={(e) => { e.stopPropagation(); setCrTargetCardId(card.id); }}
                  >
                    Request Change
                  </button>
                </div>
              ) : (
                 <span className={styles.cardInclusions}>
                   {card.type === "OUT_OF_SCOPE" 
                     ? `${safeParseArray(card.excluded).length} exclusions`
                     : `${safeParseArray(card.included).length} inclusions`}
                 </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (showSignOff) {
    return (
      <div className={styles.container}>
        <div className={styles.previewBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", borderRadius: "4px", fontSize: "0.75rem", letterSpacing: "1px" }}>PREVIEW MODE</span>
            <span>Viewing simulated client flow. Action impacts are simulated only.</span>
          </div>
          <button className={styles.backBtn} onClick={() => router.push(`/projects/${project.id}`)}>
            <ArrowLeft size={14} /> Return to Editor
          </button>
        </div>
        <div className="page-shell" style={{ paddingTop: "24px" }}>
          <div className={styles.signOffPanel}>
            <h2>Final Sign-Off</h2>
            <p className="muted">
              By signing below you confirm this is the agreed scope. Any additions after sign-off will require a formal change request and may incur additional cost.
            </p>
            <div className={styles.signOffList}>
              {inScopeCards.map((card) => (
                <div key={card.id} className={styles.signOffListItem}>
                  <strong>{card.title}</strong>
                </div>
              ))}
            </div>
            <div className={styles.signOffForm}>
              <label>Type your name exactly as: <strong>{project.clientName}</strong></label>
              <input 
                className={styles.input}
                value={typedName} 
                onChange={(e) => setTypedName(e.target.value)} 
                placeholder={project.clientName}
              />
              <button 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "16px" }}
                onClick={() => handleSimulatedAction("Sign Off Logic Trigger")}
                disabled={typedName.toLowerCase().trim() !== project.clientName.toLowerCase().trim()}
              >
                I agree and sign off
              </button>
              <button 
                className="btn btn-outline" 
                style={{ width: "100%", marginTop: "8px" }}
                onClick={() => setShowSignOff(false)}
              >
                Back to review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* PREVIEW BANNER */}
      <div className={styles.previewBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", borderRadius: "4px", fontSize: "0.75rem", letterSpacing: "1px" }}>PREVIEW MODE</span>
          <span>Visual simulation of the exact page presented to the client.</span>
        </div>
        <button className={styles.backBtn} onClick={() => router.push(`/projects/${project.id}`)}>
          <ArrowLeft size={14} /> Return to Editor
        </button>
      </div>

      {project.status === "SIGNED" ? (
        <div className={`${styles.progressHeader} ${styles.signedStickyHeader}`}>
          <div className={styles.lockContainer}>
            <span className={styles.headerIconFilled}>
              <Check size={13} color="#fff" strokeWidth={4} />
            </span>
            <strong>Project Scope Fully Signed</strong>
            {project.signedAt && (
              <span className={styles.signedDateSmall}>
                on {new Date(project.signedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.progressHeader}>
          <div className={styles.progressContainer}>
            <div className={styles.progressText}>
              <span>Review Progress</span>
              <strong>{approvedCount} of {totalInScope} features reviewed</strong>
            </div>
            <div className={styles.progressBarBg}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          {isReadyForSignOff && (
            <button className="btn btn-primary" onClick={() => setShowSignOff(true)}>
              Ready to Sign Off
            </button>
          )}
        </div>
      )}

      <div className="page-shell" style={{ paddingTop: "24px", paddingBottom: "80px" }}>
        {project.changeRequests && project.changeRequests.length > 0 && (
          <div className={styles.outOfScopeSection} style={{ borderColor: "var(--border)", marginBottom: "24px" }}>
            <div className={styles.boardHeader} style={{ marginBottom: "12px" }}>
              <h2 style={{ color: "var(--foreground)", margin: 0 }}>Change Request History</h2>
              <p className="muted" style={{ margin: "4px 0 0 0" }}>Active modifications requiring your review.</p>
            </div>
            <div className={styles.crListWrapper}>
              {project.changeRequests.map((cr: any) => (
                <div key={cr.id} className={`${styles.crClientCard} ${styles[cr.status.toLowerCase()]}`}>
                  <div className={styles.crHeader}>
                    <span className={`${styles.crStatusBadge} ${styles[cr.status.toLowerCase()]}`}>{cr.status}</span>
                    <span className={styles.crDate}>{new Date(cr.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={styles.crBody}><strong>Request:</strong> {cr.clientRequest}</p>

                  {(cr.status === "APPROVED" || cr.status === "INVOICED") && (
                    <div style={{ margin: "8px 0", padding: "8px 12px", borderLeft: "2px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {cr.agencyResponse && (
                        <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--foreground)", lineHeight: "1.45" }}>
                          <strong>Response:</strong> {cr.agencyResponse}
                        </p>
                      )}
                      {cr.additionalCost && (
                        <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--foreground)", fontWeight: 600 }}>
                          Cost Impact: {project.currency || "USD"} {cr.additionalCost}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {cr.status === "PRICED" && (
                    <div className={styles.crPricingCallout}>
                      <div className={styles.crPriceMain}>
                        <h4>Proposed Estimate</h4>
                        {cr.additionalCost && (
                          <span className={styles.crCurrency}>{project.currency || "USD"} {cr.additionalCost}</span>
                        )}
                      </div>
                      <p className={styles.crAgencyNote}><strong>Response:</strong> {cr.agencyResponse}</p>
                      {cr.additionalEffort && <p className={styles.crSubNote}><strong>Effort:</strong> {cr.additionalEffort}</p>}
                      
                      <div className={styles.crDecisionActions}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleSimulatedAction("Accept Estimate")}
                        >
                          Accept & Proceed
                        </button>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleSimulatedAction("Decline Estimate")}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {(cr.status === "APPROVED" || cr.status === "INVOICED") && (
                    <div className={styles.crStatusLabelSuccess}>
                      <Check size={14} /> Modification Approved
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Render sectioned content */}
        {project.sections.map((section: any) => {
          const sectionInScope = section.scopeCards.filter((c: any) => c.type === "IN_SCOPE");
          if (sectionInScope.length === 0) return null;
          return (
            <div key={section.id} className={styles.sectionContainer}>
              <div className={styles.boardHeader}>
                <h2>{section.title}</h2>
              </div>
              {renderCardsGrid(sectionInScope)}
            </div>
          );
        })}

        {/* Render loose cards content */}
        {project.scopeCards.filter((c: any) => c.type === "IN_SCOPE").length > 0 && (
          <div className={styles.sectionContainer}>
            <div className={styles.boardHeader}>
              <h2>General Project Scope</h2>
            </div>
            {renderCardsGrid(project.scopeCards.filter((c: any) => c.type === "IN_SCOPE"))}
          </div>
        )}

        {outOfScopeCards.length > 0 && (
          <div className={styles.outOfScopeSection}>
            <div className={styles.boardHeader}>
              <h2 style={{ color: "var(--danger)" }}>Explicitly Out of Scope</h2>
              <p className="muted">These items are NOT included in the project.</p>
            </div>
            {renderCardsGrid(outOfScopeCards)}
          </div>
        )}
      </div>

      {/* Change Request Submission Modal - SIMULATED */}
      {crTargetCardId && (
        <>
          <div className={styles.overlay} onClick={() => setCrTargetCardId(null)} />
          <div className={styles.slideOver}>
            <div className={styles.slideHeader}>
              <h3>Request Revision</h3>
              <button className={styles.closeBtn} onClick={() => setCrTargetCardId(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.slideContent}>
              <p className={styles.fullDesc}>
                You are requesting an addition or alteration to the signed scope.
              </p>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: "0.9rem" }}>
                  Describe the change needed
                </label>
                <textarea 
                  className={styles.textarea}
                  value={crText}
                  onChange={(e) => setCrText(e.target.value)}
                  placeholder="Specify what needs to change from the baseline agreement..."
                  style={{ minHeight: 160 }}
                />
              </div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                * Submitting this notifies the agency. They will return an updated estimate which you will need to accept before it becomes billing-active.
              </p>
            </div>
            <div className={styles.slideFooter}>
              <button 
                className="btn btn-primary" 
                style={{ width: "100%" }}
                onClick={() => handleSimulatedAction("Submit Change Request")}
                disabled={!crText.trim()}
              >
                Submit to Agency
              </button>
            </div>
          </div>
        </>
      )}

      {/* Slide-over panel - FUNCTIONAL PREVIEW */}
      {selectedCard && (
        <>
          <div className={styles.overlay} onClick={() => setSelectedCard(null)} />
          <div className={styles.slideOver}>
            <div className={styles.slideHeader}>
              <h3>{selectedCard.title}</h3>
              <button className={styles.closeBtn} onClick={() => setSelectedCard(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.drawerTabs}>
              <button className={`${styles.tabBtn} ${activeTab === "DETAILS" ? styles.activeTab : ""}`} onClick={() => setActiveTab("DETAILS")}>
                Details
              </button>
              <button className={`${styles.tabBtn} ${activeTab === "QA" ? styles.activeTab : ""}`} onClick={() => setActiveTab("QA")}>
                Q&A
                {selectedCard.status === "ANSWERED" && <span className={styles.dotIndicator} />}
              </button>
            </div>

            <div className={styles.slideContent}>
              {activeTab === "DETAILS" ? (
                <>
                  <div className={styles.statusBadge}>
                    {selectedCard.type === "OUT_OF_SCOPE" ? "Not Included" : selectedCard.status}
                  </div>
                  
                  <p className={styles.fullDesc}>{selectedCard.description}</p>
                  
                  {selectedCard.effort && (
                    <div className={styles.effortBlock}>
                      <strong>Estimated Effort:</strong> {selectedCard.effort}
                    </div>
                  )}

                  {selectedCard.type === "IN_SCOPE" && (
                    <div className={styles.includedSection}>
                      <h4>What is included</h4>
                      <ul className={styles.chipList}>
                        {safeParseArray(selectedCard.included).map((item: any, i: number) => (
                          <li key={i} className={`${styles.chip} ${styles.chipGreen}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCard.excluded && safeParseArray(selectedCard.excluded).length > 0 && (
                    <div className={styles.excludedSection}>
                      <h4>What is NOT included</h4>
                      <ul className={styles.chipList}>
                        {safeParseArray(selectedCard.excluded).map((item: any, i: number) => (
                          <li key={i} className={`${styles.chip} ${styles.chipCoral}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Q&A THREAD */}
                  {selectedCard.messages && selectedCard.messages.length > 0 ? (
                    <div className={styles.qaThread}>
                      {selectedCard.messages.map((msg: any) => (
                        <div key={msg.id} className={styles.chatMessage}>
                          <div className={`${styles.chatAvatar} ${msg.sender === "CLIENT" ? styles.clientAvatar : styles.agencyAvatar}`}>
                            {msg.sender === "CLIENT" ? "Y" : "A"}
                          </div>
                          <div className={styles.chatContent}>
                            <div className={styles.chatHeader}>
                              <span className={`${styles.chatAuthor} ${msg.sender === "CLIENT" ? styles.authorClient : styles.authorAgency}`}>
                                {msg.sender === "CLIENT" ? "You" : "Agency"}
                              </span>
                              <span className={styles.chatTime}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={styles.chatBody}>{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted" style={{ fontSize: "0.9rem", fontStyle: "italic", padding: "20px 0" }}>
                      No questions have been asked for this card yet.
                    </p>
                  )}

                  {/* Q&A INPUT BOX */}
                  <div className={styles.replyInputWrapper}>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="What would you like to ask?"
                      className={styles.replyTextarea}
                      rows={2}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSimulatedAction("Ask Question")}
                      className={styles.replySubmitBtn}
                      disabled={!questionText.trim()}
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>

            {project.status === "SIGNED" ? (
              <div className={styles.slideFooter}>
                <div className={styles.approvedMessage} style={{ marginBottom: 20 }}>
                  <CheckCircle2 color="var(--success)" size={24} />
                  <span>Officially Signed</span>
                </div>
                {selectedCard.type === "IN_SCOPE" && (
                  <button 
                    className="btn btn-outline" 
                    style={{ width: "100%" }}
                    onClick={() => {
                      setCrTargetCardId(selectedCard.id);
                      setSelectedCard(null);
                    }}
                  >
                    <Edit size={18} style={{ marginRight: "8px" }} />
                    Request a revision
                  </button>
                )}
              </div>
            ) : (
              <>
                {selectedCard.type === "IN_SCOPE" && selectedCard.status !== "APPROVED" && (
                  <div className={styles.slideFooter}>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: "100%", marginBottom: "12px", padding: "14px", fontSize: "1.05rem" }}
                      onClick={() => handleSimulatedAction("Approve Feature")}
                    >
                      <Check size={20} style={{ marginRight: "8px" }} />
                      Approve this feature
                    </button>
                    {activeTab !== "QA" && (
                      <>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: "100%", marginBottom: "12px" }}
                          onClick={() => setActiveTab("QA")}
                        >
                          <MessageSquare size={18} style={{ marginRight: "8px" }} />
                          Ask a question
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ width: "100%" }}
                          onClick={() => {
                            setCrTargetCardId(selectedCard.id);
                            setSelectedCard(null);
                          }}
                        >
                          <Edit size={18} style={{ marginRight: "8px" }} />
                          Request a change
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {selectedCard.status === "APPROVED" && (
                  <div className={styles.slideFooter}>
                    <div className={styles.approvedMessage}>
                      <CheckCircle2 color="var(--success)" size={24} />
                      <span>Approved</span>
                    </div>
                    <button className="btn btn-outline" style={{width: "100%", marginBottom: "12px"}} onClick={() => handleSimulatedAction("Undo Approval")}>
                      Undo Approval
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ width: "100%" }}
                      onClick={() => {
                        setCrTargetCardId(selectedCard.id);
                        setSelectedCard(null);
                      }}
                    >
                      <Edit size={18} style={{ marginRight: "8px" }} />
                      Request a change
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function safeParseArray(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
