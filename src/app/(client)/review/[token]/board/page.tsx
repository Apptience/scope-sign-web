"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientService, BoardData, ScopeCardData } from "../../../../../services/client.service";
import styles from "./board.module.css";
import { 
  Check, CheckCircle2, Circle, HelpCircle, Loader2, MessageSquare, X, Edit,
  Database, Shield, Layout, Code, Zap, Globe, Users, Settings, Layers 
} from "lucide-react";

export default function ClientBoardPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [board, setBoard] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<ScopeCardData | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [isQuestionMode, setIsQuestionMode] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [showSignOff, setShowSignOff] = useState(false);
  const [activeTab, setActiveTab] = useState<"DETAILS" | "QA">("DETAILS");
  const [crTargetCardId, setCrTargetCardId] = useState<string | null>(null);
  const [crText, setCrText] = useState("");
  const [isSubmittingCr, setIsSubmittingCr] = useState(false);
  const [isDecidingCr, setIsDecidingCr] = useState(false);

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

  const renderCardsGrid = (cards: ScopeCardData[]) => {
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
                  {board?.status !== "SIGNED" && (
                    <button 
                      className={styles.undoBtn} 
                      onClick={(e) => handleUndo(e, card.id)}
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

  useEffect(() => {
    fetchBoard();
  }, [token]);

  const fetchBoard = async () => {
    try {
      const data = await ClientService.getBoard(token);
      setBoard(data);
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (cardId: string) => {
    try {
      await ClientService.approveCard(token, cardId);
      await fetchBoard();
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard((prev) => prev ? { ...prev, status: "APPROVED" } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedCard || !questionText.trim()) return;
    try {
      await ClientService.askQuestion(token, selectedCard.id, questionText);
      const freshBoard = await fetchBoard();
      setQuestionText("");
      setIsQuestionMode(false);
      if (freshBoard) {
        const allCards = [...freshBoard.scopeCards, ...freshBoard.sections.flatMap(s => s.scopeCards)];
        const freshCard = allCards.find(c => c.id === selectedCard.id);
        if (freshCard) setSelectedCard(freshCard);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUndo = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    try {
      await ClientService.undoApproval(token, cardId);
      await fetchBoard();
      if (selectedCard && selectedCard.id === cardId) {
        setSelectedCard((prev) => prev ? { ...prev, status: "PENDING" } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOff = async () => {
    try {
      await ClientService.signOff(token, typedName);
      await fetchBoard();
      setShowSignOff(false);
    } catch (err: any) {
      alert(err.message || "Sign-off failed.");
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!crTargetCardId || !crText.trim()) return;
    setIsSubmittingCr(true);
    try {
      await ClientService.submitChangeRequest(token, crText.trim(), crTargetCardId);
      alert("Change request successfully submitted to the agency.");
      setCrText("");
      setCrTargetCardId(null);
      await fetchBoard();
    } catch (err: any) {
      alert(err.message || "Failed to submit request.");
    } finally {
      setIsSubmittingCr(false);
    }
  };

  const handleCrDecision = async (requestId: string, decision: "APPROVED" | "DECLINED") => {
    if (!confirm(`Are you sure you want to ${decision.toLowerCase()} this estimate?`)) return;
    setIsDecidingCr(true);
    try {
      await ClientService.decideChangeRequest(token, requestId, decision);
      await fetchBoard();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setIsDecidingCr(false);
    }
  };

  if (loading || !board) {
    return (
      <div className={styles.centerContainer}>
        <Loader2 className={styles.spinner} />
      </div>
    );
  }

  // Flatten cards
  const inScopeCards = [
    ...board.scopeCards.filter((c) => c.type === "IN_SCOPE"),
    ...board.sections.flatMap((s) => s.scopeCards.filter((c) => c.type === "IN_SCOPE")),
  ];
  
  const outOfScopeCards = [
    ...board.scopeCards.filter((c) => c.type === "OUT_OF_SCOPE"),
    ...board.sections.flatMap((s) => s.scopeCards.filter((c) => c.type === "OUT_OF_SCOPE")),
  ];

  const approvedCount = inScopeCards.filter((c) => c.status === "APPROVED").length;
  const totalInScope = inScopeCards.length;
  const progressPercent = totalInScope === 0 ? 0 : (approvedCount / totalInScope) * 100;
  const isReadyForSignOff = approvedCount === totalInScope && totalInScope > 0;


  if (showSignOff) {
    return (
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
            <label>Type your name exactly as: <strong>{board.clientName}</strong></label>
            <input 
              className={styles.input}
              value={typedName} 
              onChange={(e) => setTypedName(e.target.value)} 
              placeholder={board.clientName}
            />
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "16px" }}
              onClick={handleSignOff}
              disabled={typedName.toLowerCase().trim() !== board.clientName.toLowerCase().trim()}
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
    );
  }

  return (
    <>
      {board.status === "SIGNED" ? (
        <div className={`${styles.progressHeader} ${styles.signedStickyHeader}`}>
          <div className={styles.lockContainer}>
            <span className={styles.headerIconFilled}>
              <Check size={13} color="#fff" strokeWidth={4} />
            </span>
            <strong>Project Scope Fully Signed</strong>
            {board.signedAt && (
              <span className={styles.signedDateSmall}>
                on {new Date(board.signedAt).toLocaleDateString()}
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

      <div className="page-shell" style={{ paddingTop: "24px" }}>
        {board.changeRequests && board.changeRequests.length > 0 && (
          <div className={styles.outOfScopeSection} style={{ borderColor: "var(--border)", marginBottom: "24px" }}>
            <div className={styles.boardHeader} style={{ marginBottom: "12px" }}>
              <h2 style={{ color: "var(--foreground)", margin: 0 }}>Change Request History</h2>
              <p className="muted" style={{ margin: "4px 0 0 0" }}>Active modifications requiring your review.</p>
            </div>
            <div className={styles.crListWrapper}>
              {board.changeRequests.map((cr) => (
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
                          Cost Impact: {board.agency?.currency || "USD"} {cr.additionalCost}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {cr.status === "PRICED" && (
                    <div className={styles.crPricingCallout}>
                      <div className={styles.crPriceMain}>
                        <h4>Proposed Estimate</h4>
                        {cr.additionalCost && (
                          <span className={styles.crCurrency}>{board.agency?.currency || "USD"} {cr.additionalCost}</span>
                        )}
                      </div>
                      <p className={styles.crAgencyNote}><strong>Response:</strong> {cr.agencyResponse}</p>
                      {cr.additionalEffort && <p className={styles.crSubNote}><strong>Effort:</strong> {cr.additionalEffort}</p>}
                      
                      <div className={styles.crDecisionActions}>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleCrDecision(cr.id, "APPROVED")}
                          disabled={isDecidingCr}
                        >
                          Accept & Proceed
                        </button>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleCrDecision(cr.id, "DECLINED")}
                          disabled={isDecidingCr}
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
        {board.sections.map((section) => {
          const sectionInScope = section.scopeCards.filter(c => c.type === "IN_SCOPE");
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
        {board.scopeCards.filter(c => c.type === "IN_SCOPE").length > 0 && (
          <div className={styles.sectionContainer}>
            <div className={styles.boardHeader}>
              <h2>General Project Scope</h2>
            </div>
            {renderCardsGrid(board.scopeCards.filter(c => c.type === "IN_SCOPE"))}
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

      {/* Change Request Submission Modal */}
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
                onClick={handleSubmitChangeRequest}
                disabled={!crText.trim() || isSubmittingCr}
              >
                {isSubmittingCr ? "Sending..." : "Submit to Agency"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Slide-over panel */}
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
                        {safeParseArray(selectedCard.included).map((item, i) => (
                          <li key={i} className={`${styles.chip} ${styles.chipGreen}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCard.excluded && safeParseArray(selectedCard.excluded).length > 0 && (
                    <div className={styles.excludedSection}>
                      <h4>What is NOT included</h4>
                      <ul className={styles.chipList}>
                        {safeParseArray(selectedCard.excluded).map((item, i) => (
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
                      {selectedCard.messages.map((msg) => (
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
                      onClick={handleAskQuestion} 
                      className={styles.replySubmitBtn}
                      disabled={!questionText.trim()}
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>

            {board.status === "SIGNED" ? (
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
                      setSelectedCard(null); // Close detail modal
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
                      onClick={() => handleApprove(selectedCard.id)}
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
                    <button className="btn btn-outline" style={{width: "100%", marginBottom: "12px"}} onClick={(e) => handleUndo(e, selectedCard.id)}>
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
    </>
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
