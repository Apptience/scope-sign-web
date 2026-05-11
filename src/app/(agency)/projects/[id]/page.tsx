"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Edit3, Edit, Check, Globe, Copy,
  ExternalLink, Sparkles, AlertCircle, RefreshCw, Layers,
  CheckCircle, HelpCircle, FileText, ChevronRight, X,
  Database, Shield, Layout, Code, Zap, MessageSquare, Users, Settings
} from "lucide-react";
import { projectService } from "@/services/project.service";
import { api, BASE_SERVER_URL } from "@/services/api";
import axios from "axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./project-detail.module.css";

interface CardMessage {
  id: string;
  cardId: string;
  sender: "CLIENT" | "AGENCY";
  message: string;
  createdAt: string;
}

interface ScopeCard {
  id: string;
  projectId: string;
  sectionId: string | null;
  title: string;
  description: string;
  icon: string;
  effort: string | null;
  included: string; // JSON string array
  excluded: string | null; // JSON string array
  type: "IN_SCOPE" | "OUT_OF_SCOPE";
  status: "PENDING" | "APPROVED" | "QUESTION_ASKED" | "ANSWERED";
  messages?: CardMessage[];
  order: number;
}

interface Section {
  id: string;
  projectId: string;
  title: string;
  order: number;
  scopeCards: ScopeCard[];
}

interface MagicLink {
  id: string;
  projectId: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
}

interface ActivityLog {
  id: string;
  projectId: string;
  action: string;
  details: string;
  createdAt: string;
}

interface ChangeRequest {
  id: string;
  projectId: string;
  scopeCardId: string | null;
  status: string;
  clientRequest: string;
  agencyResponse: string | null;
  additionalEffort: string | null;
  additionalCost: number | null;
  timelineImpactDays: number | null;
  internalNotes: string | null;
  createdAt: string;
}

interface ProjectDetail {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  clientWhatsApp: string | null;
  type: string;
  currency: string;
  status: string;
  sowText: string | null;
  sowUrl: string | null;
  sections: Section[];
  scopeCards: ScopeCard[]; // Unsectioned cards
  magicLinks: MagicLink[];
  activityLogs: ActivityLog[];
  changeRequests: ChangeRequest[];
}

const ICONS_POOL = [
  "Feature", "Database", "Shield", "Layout", "Code", "Zap", "Globe", "MessageSquare", "Users", "Settings"
];

/* --- Sortable Components --- */
function SortableScopeCard({ card, renderCardIcon, onClick }: { card: ScopeCard; renderCardIcon: (i: string) => React.ReactNode; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "CARD", card } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : "auto",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.scopeCard} ${styles[card.type.toLowerCase()]} ${styles[card.status.toLowerCase()]}`}
      onClick={onClick}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardIcon}>{renderCardIcon(card.icon)}</span>
        <span className={`${styles.cardStatusBadge} ${styles[card.status.toLowerCase()]}`}>
          {card.status.replace("_", " ")}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{card.title}</h3>
      <p className={styles.cardDesc}>{card.description}</p>
      <div className={styles.cardBottom}>
        {card.effort && <span className={styles.cardEffort}>Effort: {card.effort}</span>}
        <span className={styles.cardInclusions}>
          {JSON.parse(card.included).length} inclusions
        </span>
      </div>
    </div>
  );
}

function SortableSectionContainer({ id, title, onAdd, children }: { id: string; title: string; onAdd: () => void; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id, data: { type: "SECTION", id } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.sectionContainer}>
      <div className={styles.sectionHeader} {...attributes} {...listeners} style={{ cursor: "grab" }}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <button
          className={styles.sectionAddCardBtn}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          style={{ cursor: "pointer" }}
        >
          <Plus size={14} /> Add Card
        </button>
      </div>
      {children}
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !project) return;

    const activeType = active.data.current?.type;
    
    // Reorder SECTIONS
    if (activeType === "SECTION") {
      const oldIndex = project.sections.findIndex(s => s.id === active.id);
      const newIndex = project.sections.findIndex(s => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(project.sections, oldIndex, newIndex);
        // Optimistic local update
        setProject({ ...project, sections: newSections });
        // Persist to server
        try {
          await api.post("/scopeCard.reorderSections", {
            sections: newSections.map((s, index) => ({ id: s.id, order: index + 1 }))
          });
        } catch (err) {
          console.error("Failed reordering sections", err);
          fetchProjectData();
        }
      }
    }
    
    // Reorder CARDS (only within same container for now)
    if (activeType === "CARD") {
      // Check all containers (sections + unsectioned)
      // Find active card's current container
      let targetSectionId: string | null = null;
      let sourceList: ScopeCard[] = [];
      
      const activeCard = active.data.current?.card as ScopeCard;
      if (!activeCard) return;
      
      const inSection = project.sections.find(s => s.scopeCards.some(c => c.id === activeCard.id));
      
      if (inSection) {
        sourceList = inSection.scopeCards;
        targetSectionId = inSection.id;
      } else {
        sourceList = project.scopeCards;
        targetSectionId = null;
      }
      
      // Validate that we are dropping over a card in the same container
      const overCardId = over.id as string;
      const oldIndex = sourceList.findIndex(c => c.id === activeCard.id);
      const newIndex = sourceList.findIndex(c => c.id === overCardId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newList = arrayMove(sourceList, oldIndex, newIndex);
        // Optimistic local update
        if (targetSectionId) {
          setProject({
            ...project,
            sections: project.sections.map(s => s.id === targetSectionId ? { ...s, scopeCards: newList } : s)
          });
        } else {
          setProject({ ...project, scopeCards: newList });
        }
        
        // Persist to server
        try {
          await api.post("/scopeCard.reorderCards", {
            cards: newList.map((c, index) => ({ id: c.id, order: index + 1, sectionId: targetSectionId }))
          });
        } catch (err) {
          console.error("Failed reordering cards", err);
          fetchProjectData();
        }
      }
    }
  }

  // Popover state
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Section / Card details states
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  // Card Drawer states
  const [selectedCard, setSelectedCard] = useState<Partial<ScopeCard> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agencyReplyText, setAgencyReplyText] = useState("");
  const [activeTab, setActiveTab] = useState<"DETAILS" | "QA">("DETAILS");

  // Project Settings Editor State
  const [projectSettingsDrawerOpen, setProjectSettingsDrawerOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientWhatsApp: "",
    type: "",
    currency: "",
    status: ""
  });

  // Pricing Flow State
  const [activeCrForPricing, setActiveCrForPricing] = useState<ChangeRequest | null>(null);
  const [pricingForm, setPricingForm] = useState({
    agencyResponse: "",
    additionalCost: "",
    additionalEffort: "",
    timelineImpactDays: 0,
    internalNotes: "",
    cardDescription: "",
    cardIncluded: [] as string[],
    cardExcluded: [] as string[],
  });
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const renderCardIcon = (iconName: string) => {
    switch (iconName) {
      case "Database":
        return <Database size={16} />;
      case "Shield":
        return <Shield size={16} />;
      case "Layout":
        return <Layout size={16} />;
      case "Code":
        return <Code size={16} />;
      case "Zap":
        return <Zap size={16} />;
      case "Globe":
        return <Globe size={16} />;
      case "MessageSquare":
        return <MessageSquare size={16} />;
      case "Users":
        return <Users size={16} />;
      case "Settings":
        return <Settings size={16} />;
      case "Feature":
      default:
        return <Layers size={16} />;
    }
  };
  const [includedInput, setIncludedInput] = useState("");
  const [excludedInput, setExcludedInput] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await handleUploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadFile(file);
    }
  };

  const handleUploadFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx");

    if (!isPdf && !isDocx) {
      setUploadError("Please upload a valid PDF or DOCX SOW document.");
      return;
    }

    setUploadingFile(true);
    setUploadError("");
    setUploadProgress("Uploading SOW file...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const progressSteps = [
        "Uploading SOW document...",
        "Extracting raw document text...",
        "Structuring scope with Groq openai/gpt-oss-120b...",
        "Creating modular scope cards...",
        "Finalizing project board..."
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          stepIndex++;
          setUploadProgress(progressSteps[stepIndex]);
        }
      }, 3500);

      const response = await axios.post(`${BASE_SERVER_URL}/api/projects/${id}/upload-sow`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      clearInterval(progressInterval);

      if (response.status === 200 && response.data.success) {
        setUploadProgress("Scope Board populated successfully!");
        setTimeout(() => {
          setUploadingFile(false);
          fetchProjectData();
        }, 1500);
      } else {
        setUploadError(response.data.error || "Failed to parse SOW file.");
        setUploadingFile(false);
      }
    } catch (err: any) {
      console.error("[UPLOAD_SOW_CLIENT] Error:", err);
      setUploadError(err.response?.data?.error || err.message || "Failed to communicate with server.");
      setUploadingFile(false);
    }
  };

  const handleRegenerateSow = async () => {
    if (!confirm("Are you sure you want to regenerate? This will delete all current sections and cards and rebuild the board using the saved SOW document.")) {
      return;
    }

    setUploadingFile(true);
    setUploadError("");
    setUploadProgress("Initiating scope regeneration...");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const progressSteps = [
        "Clearing existing board sections...",
        "Parsing stored SOW text...",
        "Generating detailed scope cards...",
        "Structuring deliverable inclusions...",
        "Finalizing updated scope board..."
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          stepIndex++;
          setUploadProgress(progressSteps[stepIndex]);
        }
      }, 3500);

      const response = await axios.post(`${BASE_SERVER_URL}/api/projects/${id}/regenerate-sow`, {}, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      clearInterval(progressInterval);

      if (response.status === 200 && response.data.success) {
        setUploadProgress("Scope Board regenerated successfully!");
        setTimeout(() => {
          setUploadingFile(false);
          fetchProjectData();
        }, 1500);
      } else {
        setUploadError(response.data.error || "Failed to regenerate scope board.");
        setUploadingFile(false);
      }
    } catch (err: any) {
      console.error("[REGENERATE_SOW_CLIENT] Error:", err);
      setUploadError(err.response?.data?.error || err.message || "Failed to communicate with server.");
      setUploadingFile(false);
    }
  };

  const fetchProjectData = async () => {
    try {
      const data = await projectService.getById(id);
      if (data.error) {
        setError(data.error.message || "Failed to load project details.");
      } else if (data.result?.data) {
        setProject(data.result.data);
        return data.result.data;
      }
    } catch (err) {
      setError("An error occurred while communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  // Handle generating Magic Link
  const handleGenerateMagicLink = async () => {
    setActionPending(true);
    try {
      const response = await api.post("/magicLink.generate", { projectId: id });
      if (response.data.error) {
        alert(response.data.error.message || "Failed to generate link.");
      } else {
        await fetchProjectData();
      }
    } catch (err) {
      alert("Error generating link.");
    } finally {
      setActionPending(false);
    }
  };

  // Handle adding new Section
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    setActionPending(true);
    try {
      const maxOrder = project?.sections.reduce((max, s: Section) => Math.max(max, s.order), 0) ?? 0;
      const response = await api.post("/scopeCard.addSection", {
        projectId: id,
        title: newSectionTitle.trim(),
        order: maxOrder + 1
      });
      if (response.data.error) {
        alert(response.data.error.message || "Failed to create section.");
      } else {
        setNewSectionTitle("");
        setShowAddSection(false);
        await fetchProjectData();
      }
    } catch (err) {
      alert("Error creating section.");
    } finally {
      setActionPending(false);
    }
  };

  // Handle Card Save (Create or Update)
  const handleSaveCard = async () => {
    if (!selectedCard?.title?.trim()) {
      alert("Card title is required.");
      return;
    }
    setActionPending(true);
    try {
      const includedArr = selectedCard.included ? JSON.parse(selectedCard.included) : [];
      const excludedArr = selectedCard.excluded ? JSON.parse(selectedCard.excluded) : [];

      if (selectedCard.id) {
        // Update Card
        const response = await api.post("/scopeCard.updateCard", {
          id: selectedCard.id,
          sectionId: selectedCard.sectionId || null,
          title: selectedCard.title,
          description: selectedCard.description || "",
          icon: selectedCard.icon || "Feature",
          effort: selectedCard.effort || null,
          included: includedArr,
          excluded: excludedArr,
          type: selectedCard.type || "IN_SCOPE"
        });

        if (response.data.error) {
          alert(response.data.error.message || "Failed to update card.");
        } else {
          setDrawerOpen(false);
          await fetchProjectData();
        }
      } else {
        // Create Card
        const maxOrder = project?.scopeCards.reduce((max, c) => Math.max(max, c.order), 0) ?? 0;
        const response = await api.post("/scopeCard.createCard", {
          projectId: id,
          sectionId: selectedCard.sectionId || null,
          title: selectedCard.title,
          description: selectedCard.description || "",
          icon: selectedCard.icon || "Feature",
          effort: selectedCard.effort || null,
          included: includedArr,
          excluded: excludedArr,
          type: selectedCard.type || "IN_SCOPE",
          order: maxOrder + 1
        });

        if (response.data.error) {
          alert(response.data.error.message || "Failed to create card.");
        } else {
          setDrawerOpen(false);
          await fetchProjectData();
        }
      }
    } catch (err) {
      alert("Error saving card.");
    } finally {
      setActionPending(false);
    }
  };

  // Handle deleting a card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this scope card?")) return;
    setActionPending(true);
    try {
      const response = await api.post("/scopeCard.deleteCard", { id: cardId });
      if (response.data.error) {
        alert(response.data.error.message || "Failed to delete card.");
      } else {
        setDrawerOpen(false);
        await fetchProjectData();
      }
    } catch (err) {
      alert("Error deleting card.");
    } finally {
      setActionPending(false);
    }
  };

  const handleAnswerQuestion = async () => {
    if (!selectedCard?.id || !agencyReplyText.trim()) return;
    setActionPending(true);
    try {
      const response = await api.post("/scopeCard.answerQuestion", {
        id: selectedCard.id,
        reply: agencyReplyText.trim()
      });
      if (response.data.error) {
        alert(response.data.error.message || "Failed to submit reply.");
      } else {
        setAgencyReplyText("");
        const freshProj = await fetchProjectData();
        if (freshProj && selectedCard.id) {
          const allCards = [...freshProj.scopeCards, ...freshProj.sections.flatMap((s: Section) => s.scopeCards)];
          const freshCard = allCards.find(c => c.id === selectedCard.id);
          if (freshCard) setSelectedCard(freshCard);
        }
      }
    } catch (err) {
      alert("Error submitting reply.");
    } finally {
      setActionPending(false);
    }
  };

  const handlePriceSubmit = async () => {
    if (!activeCrForPricing || !pricingForm.agencyResponse.trim()) return;
    setIsSavingPrice(true);
    try {
      await projectService.priceChangeRequest({
        id: activeCrForPricing.id,
        agencyResponse: pricingForm.agencyResponse,
        additionalEffort: pricingForm.additionalEffort || undefined,
        additionalCost: pricingForm.additionalCost ? parseFloat(pricingForm.additionalCost) : undefined,
        timelineImpactDays: pricingForm.timelineImpactDays || 0,
        internalNotes: pricingForm.internalNotes || undefined,
        
        // Card Mutations
        cardDescription: pricingForm.cardDescription || undefined,
        cardIncluded: pricingForm.cardIncluded,
        cardExcluded: pricingForm.cardExcluded,
      });
      setActiveCrForPricing(null);
      setPricingForm({ 
        agencyResponse: "", 
        additionalCost: "", 
        additionalEffort: "", 
        timelineImpactDays: 0, 
        internalNotes: "",
        cardDescription: "",
        cardIncluded: [],
        cardExcluded: []
      });
      await fetchProjectData();
    } catch (err) {
      alert("Failed to save pricing.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleMarkInvoiced = async (crId: string) => {
    if (!confirm("Mark this Change Request as officially invoiced?")) return;
    setActionPending(true);
    try {
      await projectService.markCrInvoiced(crId);
      await fetchProjectData();
    } catch (err) {
      alert("Action failed.");
    } finally {
      setActionPending(false);
    }
  };

  const handleOpenProjectSettings = () => {
    if (!project) return;
    setProjectForm({
      name: project.name,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      clientCompany: project.clientCompany || "",
      clientWhatsApp: project.clientWhatsApp || "",
      type: project.type,
      currency: project.currency,
      status: project.status
    });
    setProjectSettingsDrawerOpen(true);
  };

  const handleSaveProjectSettings = async () => {
    if (!projectForm.name.trim() || !projectForm.clientName.trim() || !projectForm.clientEmail.trim()) {
      alert("Project name, Client name, and Client email are required.");
      return;
    }
    setActionPending(true);
    try {
      await projectService.update({
        id,
        ...projectForm
      });
      setProjectSettingsDrawerOpen(false);
      await fetchProjectData();
    } catch (err) {
      alert("Failed to update project details.");
    } finally {
      setActionPending(false);
    }
  };

  // Add Item Chip for Included / Excluded lists
  const addIncludedChip = () => {
    if (!includedInput.trim()) return;
    const currentList = selectedCard?.included ? JSON.parse(selectedCard.included) : [];
    const newList = [...currentList, includedInput.trim()];
    setSelectedCard({ ...selectedCard, included: JSON.stringify(newList) });
    setIncludedInput("");
  };

  const removeIncludedChip = (index: number) => {
    const currentList = selectedCard?.included ? JSON.parse(selectedCard.included) : [];
    const newList = currentList.filter((_: any, i: number) => i !== index);
    setSelectedCard({ ...selectedCard, included: JSON.stringify(newList) });
  };

  const addExcludedChip = () => {
    if (!excludedInput.trim()) return;
    const currentList = selectedCard?.excluded ? JSON.parse(selectedCard.excluded) : [];
    const newList = [...currentList, excludedInput.trim()];
    setSelectedCard({ ...selectedCard, excluded: JSON.stringify(newList) });
    setExcludedInput("");
  };

  const removeExcludedChip = (index: number) => {
    const currentList = selectedCard?.excluded ? JSON.parse(selectedCard.excluded) : [];
    const newList = currentList.filter((_: any, i: number) => i !== index);
    setSelectedCard({ ...selectedCard, excluded: JSON.stringify(newList) });
  };

  const handleDragStartChip = (e: React.DragEvent, listType: "included" | "excluded", index: number, value: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ listType, index, value }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnIncluded = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const { listType, index, value } = JSON.parse(data);
      if (listType === "excluded") {
        const curExc = selectedCard?.excluded ? JSON.parse(selectedCard.excluded) : [];
        const newExc = curExc.filter((_: any, i: number) => i !== index);
        const curInc = selectedCard?.included ? JSON.parse(selectedCard.included) : [];
        const newInc = [...curInc, value];
        setSelectedCard({
          ...selectedCard,
          excluded: JSON.stringify(newExc),
          included: JSON.stringify(newInc)
        });
      }
    } catch (err) { }
  };

  const handleDropOnExcluded = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const { listType, index, value } = JSON.parse(data);
      if (listType === "included") {
        const curInc = selectedCard?.included ? JSON.parse(selectedCard.included) : [];
        const newInc = curInc.filter((_: any, i: number) => i !== index);
        const curExc = selectedCard?.excluded ? JSON.parse(selectedCard.excluded) : [];
        const newExc = [...curExc, value];
        setSelectedCard({
          ...selectedCard,
          included: JSON.stringify(newInc),
          excluded: JSON.stringify(newExc)
        });
      }
    } catch (err) { }
  };




  // Quick helper to initiate new card
  const handleInitiateNewCard = (sectionId: string | null) => {
    setSelectedCard({
      sectionId,
      title: "",
      description: "",
      icon: "Feature",
      effort: "",
      included: JSON.stringify([]),
      excluded: JSON.stringify([]),
      type: "IN_SCOPE"
    });
    setDrawerOpen(true);
    setActiveTab("DETAILS");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} className={styles.errorIcon} />
        <h2>Failed to load project</h2>
        <p>{error || "The project you are trying to view does not exist."}</p>
        <button type="button" onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const activeMagicLink = project.magicLinks?.find(link => link.isActive);
  const clientLink = activeMagicLink
    ? `${window.location.protocol}//${window.location.host}/review/${activeMagicLink.token}`
    : null;

  // Calculate stats
  const inScopeCards = [
    ...project.scopeCards.filter(c => c.type === "IN_SCOPE"),
    ...project.sections.flatMap((s: Section) => s.scopeCards.filter(c => c.type === "IN_SCOPE"))
  ];
  const outOfScopeCards = [
    ...project.scopeCards.filter(c => c.type === "OUT_OF_SCOPE"),
    ...project.sections.flatMap((s: Section) => s.scopeCards.filter(c => c.type === "OUT_OF_SCOPE"))
  ];

  const totalInScope = inScopeCards.length;
  const approvedInScope = inScopeCards.filter(c => c.status === "APPROVED").length;
  const isSendToClientReady = totalInScope > 0 && inScopeCards.every(c => c.title && c.description && JSON.parse(c.included).length > 0);

  return (
    <div className={styles.pageShell}>
      {uploadingFile && (project.sections.length > 0 || project.scopeCards.length > 0) && (
        <div className={styles.fullPageProgressOverlay}>
          <div className={styles.aiProgressSpinner} />
          <p className={styles.aiProgressText}>{uploadProgress}</p>
          <p className={styles.aiProgressSubtext}>Please keep this window open while our AI reconstructs your scope board.</p>
        </div>
      )}
      {/* HEADER SECTION */}
      <header className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "4px" }}>
          <button type="button" onClick={() => router.back()} className={styles.backLink} style={{ margin: 0 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <button
            className={styles.editProjectBtn}
            onClick={handleOpenProjectSettings}
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
          >
            <Edit size={14} /> Edit Project Details
          </button>
        </div>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.projectTitle}>{project.name}</h1>
            <div className={styles.metaRow}>
              <span className={`${styles.statusBadge} ${styles[project.status.toLowerCase()]}`}>
                {project.status.replace("_", " ")}
              </span>
              <span className={styles.metaText}>Client: <strong>{project.clientName}</strong></span>
              {project.clientCompany && (
                <span className={styles.metaText}>({project.clientCompany})</span>
              )}
              <span className={styles.metaText}>Currency: <strong>{project.currency}</strong></span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.addSectionBtn}
              onClick={() => setShowAddSection(!showAddSection)}
            >
              <Plus size={16} /> Add Section
            </button>

            {project.sowText && (
              <div className={styles.regenerateDropdownContainer}>
                <button
                  type="button"
                  className={styles.headerRegenerateBtn}
                  onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                  disabled={uploadingFile}
                >
                  <RefreshCw size={16} className={uploadingFile ? styles.spinIcon : ""} /> Regenerate SOW
                </button>
                {showRegenerateMenu && (
                  <div className={styles.regenerateDropdownMenu}>
                    <button
                      className={styles.regenerateDropdownItem}
                      onClick={() => {
                        setShowRegenerateMenu(false);
                        handleRegenerateSow();
                      }}
                    >
                      <RefreshCw size={14} /> Regenerate using current SOW
                    </button>
                    <button
                      className={styles.regenerateDropdownItem}
                      onClick={() => {
                        setShowRegenerateMenu(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <FileText size={14} /> Re-upload new SOW file
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
              </div>
            )}
            <Link href={`/projects/${project.id}/preview`} className={styles.previewBtn}>
              <ExternalLink size={16} /> Preview Board
            </Link>
          </div>
        </div>
      </header>

      {/* HORIZONTAL METRICS STRIP */}
      <div className={styles.statsStrip}>
        <div className={styles.stripItem}>
          <span className={styles.stripValue}>{totalInScope}</span>
          <span className={styles.stripLabel}>In-Scope Features</span>
        </div>
        <div className={styles.stripDivider} />
        <div className={styles.stripItem}>
          <span className={styles.stripValue}>{approvedInScope} / {totalInScope}</span>
          <span className={styles.stripLabel}>Approved By Client</span>
        </div>
        <div className={styles.stripDivider} />
        <div className={styles.stripItem}>
          <span className={styles.stripValue}>{outOfScopeCards.length}</span>
          <span className={styles.stripLabel}>Explicit Exclusions</span>
        </div>
        {clientLink ? (
          <>
            <div className={styles.stripDivider} />
            <div className={styles.stripItemLink}>
              <span className={styles.stripLabel}>Client Link</span>
              <div className={styles.stripLinkWrapper}>
                <div className={styles.stripLinkActions}>
                  <input type="text" readOnly value={clientLink} className={styles.stripLinkInput} />
                  <button onClick={() => copyToClipboard(clientLink)} className={styles.stripCopyBtn}>
                    {copied ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleGenerateMagicLink}
                  className={styles.stripRegenerateBtn}
                  disabled={actionPending}
                  title="Regenerate Link"
                >
                  <RefreshCw size={14} className={actionPending ? styles.spinIcon : ""} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.stripDivider} />
            <div className={styles.stripItemBtn}>
              <button
                onClick={handleGenerateMagicLink}
                className={styles.stripGenerateBtn}
                disabled={actionPending || totalInScope === 0}
              >
                <Sparkles size={12} /> Generate Client Link
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* HIGH-ATTENTION CHANGE REQUESTS LIST */}
      {project.changeRequests?.length > 0 && (
        <div style={{ marginTop: "24px", marginBottom: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 className={styles.footerSectionTitle} style={{ margin: 0, color: "var(--foreground)", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} color="#d97706" /> Change Request History
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Requires operational review and pricing action</span>
          </div>
          
          <div className={styles.crList}>
            {project.changeRequests.map((cr) => {
              // Perform state tree inspection to extract existing Card identity for header duplication
              let foundCard = project.scopeCards.find((c: ScopeCard) => c.id === cr.scopeCardId);
              if (!foundCard) {
                foundCard = project.sections.flatMap((s: Section) => s.scopeCards).find((c: ScopeCard) => c.id === cr.scopeCardId);
              }

              return (
                <div 
                  key={cr.id} 
                  className={`${styles.scopeCard} ${(cr.status === "NEW" || cr.status === "PRICED") ? styles.change_requested : ""}`} 
                  style={{ cursor: "default", position: "relative", borderStyle: (cr.status === "NEW" || cr.status === "PRICED") ? "dashed" : "solid" }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardIcon}>{renderCardIcon(foundCard?.icon || "Layers")}</span>
                    <span className={`${styles.cardStatusBadge} ${(cr.status === "APPROVED" || cr.status === "INVOICED") ? styles.approved : styles.change_requested}`}>
                      {cr.status}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{foundCard?.title || "Project Variance"}</h3>
                  <p className={styles.cardDesc} style={{ WebkitLineClamp: 3, marginBottom: 12 }}>
                    <strong>Request:</strong> {cr.clientRequest}
                  </p>

                  <div style={{ marginTop: "auto" }}>
                    {cr.status === "NEW" && (
                      <button 
                        className={styles.crTriggerBtn} 
                        style={{ marginTop: 0 }}
                        onClick={() => {
                          setActiveCrForPricing(cr);
                          setPricingForm({
                            agencyResponse: "",
                            additionalCost: "",
                            additionalEffort: "",
                            timelineImpactDays: 0,
                            internalNotes: "",
                            cardDescription: foundCard?.description || "",
                            cardIncluded: foundCard?.included ? JSON.parse(foundCard.included) : [],
                            cardExcluded: foundCard?.excluded ? JSON.parse(foundCard.excluded) : [],
                          });
                        }}
                      >
                        Review & Price
                      </button>
                    )}

                    {cr.status === "PRICED" && (
                      <div style={{ background: "var(--background-secondary)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>Pricing Proposal Sent</p>
                        <p className={styles.crPricing} style={{ marginTop: 2 }}><strong>{project.currency} {cr.additionalCost || 0}</strong></p>
                      </div>
                    )}

                    {cr.status === "APPROVED" && (
                      <div className={styles.crActionsWrapper} style={{ background: "rgba(45, 125, 70, 0.05)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(45, 125, 70, 0.1)" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--success)", fontWeight: 600 }}>APPROVED</p>
                          <p className={styles.crPricing} style={{ marginTop: 0, fontSize: "0.8rem" }}>{project.currency} {cr.additionalCost || 0}</p>
                        </div>
                        <button className={styles.crInvoiceBtn} onClick={() => handleMarkInvoiced(cr.id)}>
                          Invoice
                        </button>
                      </div>
                    )}

                    {cr.status === "INVOICED" && (
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>✓ Settled & Invoiced</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <hr style={{ border: "none", borderBottom: "1px solid var(--border)", marginTop: "32px", opacity: 0.5 }} />
        </div>
      )}

      {/* QUICK INLINE SECTION BUILDER */}
      {showAddSection && (
        <form onSubmit={handleAddSection} className={styles.inlineSectionForm}>
          <input
            type="text"
            placeholder="Enter Section Name (e.g., Phase 1 - Authentication)"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            className={styles.sectionInput}
            required
            autoFocus
          />
          <button type="submit" className={styles.saveSectionBtn} disabled={actionPending}>
            Create
          </button>
          <button type="button" className={styles.cancelSectionBtn} onClick={() => setShowAddSection(false)}>
            Cancel
          </button>
        </form>
      )}

      {/* CONTENT COLUMNS */}
      <div className={styles.mainGridFullWidth}>
        {/* LEFT COLUMN: THE BOARD */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className={styles.boardColumn}>
            {/* SECTIONS */}
            <SortableContext items={project.sections.map((s: Section) => s.id)} strategy={verticalListSortingStrategy}>
              {project.sections.map((sec) => (
                <SortableSectionContainer key={sec.id} id={sec.id} title={sec.title} onAdd={() => handleInitiateNewCard(sec.id)}>
                  {sec.scopeCards.length === 0 ? (
                    <div className={styles.emptyCardSlot} onClick={() => handleInitiateNewCard(sec.id)}>
                      <Plus size={16} /> Create first card in this section
                    </div>
                  ) : (
                    <div className={styles.cardGrid}>
                      <SortableContext items={sec.scopeCards.map(c => c.id)} strategy={rectSortingStrategy}>
                        {sec.scopeCards.map((card) => (
                          <SortableScopeCard
                            key={card.id}
                            card={card}
                            renderCardIcon={renderCardIcon}
                            onClick={() => {
                              setSelectedCard(card);
                              setDrawerOpen(true);
                              setActiveTab("DETAILS");
                            }}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  )}
                </SortableSectionContainer>
              ))}
            </SortableContext>

            {/* UNSECTIONED CARDS */}
            <div className={styles.sectionContainer}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>General Scope Cards</h2>
                <button
                  className={styles.sectionAddCardBtn}
                  onClick={() => handleInitiateNewCard(null)}
                  style={{ cursor: "pointer" }}
                >
                  <Plus size={14} /> Add Card
                </button>
              </div>

              {project.scopeCards.length === 0 && project.sections.length > 0 ? (
                <p className={styles.noUnsectionedText}>All cards are currently organized in sections.</p>
              ) : project.scopeCards.length === 0 ? (
                <div className={styles.asymmetricEmptyState}>
                  {/* LEFT: AI SOW ARCHITECT */}
                  <div
                    className={`${styles.aiUploadZone} ${isDragging ? styles.dragging : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("sow-file-input")?.click()}
                  >
                    {uploadingFile ? (
                      <div className={styles.aiProgressOverlay} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.aiProgressSpinner} />
                        <p className={styles.aiProgressText}>{uploadProgress}</p>
                        <p className={styles.aiProgressSubtext}>Please keep this window open while our AI analyzes your SOW document.</p>
                      </div>
                    ) : null}

                    <div className={styles.aiUploadIconWrapper}>
                      <Sparkles size={32} />
                    </div>
                    <h3 className={styles.aiUploadTitle}>AI Scope Architect</h3>
                    <p className={styles.aiUploadSubtitle}>
                      Drag and drop your SOW document (PDF or DOCX) here, or click to browse. Let AI analyze and auto-generate your modular sections and cards.
                    </p>
                    <button type="button" className={styles.aiUploadActionBtn}>
                      Upload SOW Document
                    </button>
                    <input
                      type="file"
                      id="sow-file-input"
                      className={styles.aiUploadInput}
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                    {uploadError && (
                      <p className={styles.aiUploadError}>{uploadError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  <SortableContext items={project.scopeCards.map(c => c.id)} strategy={rectSortingStrategy}>
                    {project.scopeCards.map((card) => (
                      <SortableScopeCard
                        key={card.id}
                        card={card}
                        renderCardIcon={renderCardIcon}
                        onClick={() => {
                          setSelectedCard(card);
                          setDrawerOpen(true);
                          setActiveTab("DETAILS");
                        }}
                      />
                    ))}
                  </SortableContext>
                </div>
              )}
            </div>
          </div>
        </DndContext>
      </div>

      {/* WORKSPACE FOOTER FOR TIMELINES & REQUESTS */}
      <footer className={styles.boardFooter}>

        <div className={styles.footerSection}>
          <h3 className={styles.footerSectionTitle}>Recent Activity</h3>
          {project.activityLogs?.length > 0 ? (
            <div className={styles.activityFeed}>
              {project.activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className={styles.activityItem}>
                  <div className={styles.activityBullet} />
                  <div>
                    <p className={styles.activityAction}>{log.action.replace("_", " ")}</p>
                    <span className={styles.activityTime}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noDataText}>No recent actions recorded.</p>
          )}
        </div>
      </footer>

      {/* DETAILED DRAWER/SLIDE-OVER CARD EDITOR */}
      {drawerOpen && selectedCard && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <div>
                <h2 className={styles.drawerTitle}>
                  {selectedCard.id ? "Edit Scope Card" : "New Scope Card"}
                </h2>
                <p className={styles.drawerSubtitle}>Define plain-English description and boundaries.</p>
              </div>
              <button className={styles.closeDrawerBtn} onClick={() => setDrawerOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className={styles.drawerTabs}>
              <button className={`${styles.tabBtn} ${activeTab === "DETAILS" ? styles.activeTab : ""}`} onClick={() => setActiveTab("DETAILS")}>
                Details
              </button>
              {selectedCard.id && (
                <button className={`${styles.tabBtn} ${activeTab === "QA" ? styles.activeTab : ""}`} onClick={() => setActiveTab("QA")}>
                  Q&A
                  {selectedCard.status === "QUESTION_ASKED" && <span className={styles.dotIndicator} />}
                </button>
              )}
            </div>

            <div className={styles.drawerContent}>
              {activeTab === "DETAILS" ? (
                <>
                  {/* CARD TITLE */}
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>Card Title</label>
                    <input
                      type="text"
                      value={selectedCard.title || ""}
                      onChange={(e) => setSelectedCard({ ...selectedCard, title: e.target.value })}
                      placeholder="e.g., Secure User Authentication"
                      className={styles.drawerInput}
                      required
                    />
                  </div>

                  {/* CARD DESCRIPTION */}
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>Plain-English Description</label>
                    <textarea
                      value={selectedCard.description || ""}
                      onChange={(e) => setSelectedCard({ ...selectedCard, description: e.target.value })}
                      placeholder="Describe what this feature is and what it does in simple terms..."
                      className={styles.drawerTextarea}
                      rows={4}
                    />
                  </div>

                  <div className={styles.drawerTwoCol}>
                    {/* ICON */}
                    <div className={styles.drawerField}>
                      <label className={styles.drawerLabel}>Visual Icon</label>
                      <select
                        value={selectedCard.icon || "Feature"}
                        onChange={(e) => setSelectedCard({ ...selectedCard, icon: e.target.value })}
                        className={styles.drawerSelect}
                      >
                        {ICONS_POOL.map((ico) => (
                          <option key={ico} value={ico}>{ico}</option>
                        ))}
                      </select>
                    </div>

                    {/* EFFORT */}
                    <div className={styles.drawerField}>
                      <label className={styles.drawerLabel}>Effort Estimate (Optional)</label>
                      <input
                        type="text"
                        value={selectedCard.effort || ""}
                        onChange={(e) => setSelectedCard({ ...selectedCard, effort: e.target.value })}
                        placeholder="e.g., 3-5 days"
                        className={styles.drawerInput}
                      />
                    </div>
                  </div>

                  {/* SCOPE TYPE */}
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>Scope Type</label>
                    <div className={styles.typeToggleWrapper}>
                      <button
                        type="button"
                        className={`${styles.typeToggleBtn} ${selectedCard.type === "IN_SCOPE" ? styles.activeInScope : ""}`}
                        onClick={() => setSelectedCard({ ...selectedCard, type: "IN_SCOPE" })}
                      >
                        In Scope
                      </button>
                      <button
                        type="button"
                        className={`${styles.typeToggleBtn} ${selectedCard.type === "OUT_OF_SCOPE" ? styles.activeOutOfScope : ""}`}
                        onClick={() => setSelectedCard({ ...selectedCard, type: "OUT_OF_SCOPE" })}
                      >
                        Explicit Exclusion
                      </button>
                    </div>
                  </div>

                  {/* INCLUDED ITEMS CHIPS */}
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>What is INCLUDED (Deliverables / Boundaries)</label>
                    <div className={styles.chipInputRow}>
                      <input
                        type="text"
                        value={includedInput}
                        onChange={(e) => setIncludedInput(e.target.value)}
                        placeholder="Type an item and press Enter or Add..."
                        className={styles.drawerInput}
                        onKeyDown={(e) => e.key === "Enter" && addIncludedChip()}
                      />
                      <button type="button" onClick={addIncludedChip} className={styles.addChipBtn}>
                        Add
                      </button>
                    </div>
                    <div
                      className={styles.chipsContainer}
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnIncluded}
                      style={{ minHeight: "40px" }}
                    >
                      {selectedCard.included && JSON.parse(selectedCard.included).map((item: string, index: number) => (
                        <span
                          key={index}
                          className={`${styles.chip} ${styles.incChip}`}
                          draggable
                          onDragStart={(e) => handleDragStartChip(e, "included", index, item)}
                          title="Drag to exclude"
                        >
                          {item}
                          <button type="button" onClick={() => removeIncludedChip(index)} className={styles.removeChipBtn}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {(!selectedCard.included || JSON.parse(selectedCard.included).length === 0) && (
                        <p className={styles.noChipsText}>No items added yet. Please define at least one inclusion.</p>
                      )}
                    </div>
                  </div>

                  {/* EXCLUDED ITEMS CHIPS */}
                  <div className={styles.drawerField}>
                    <label className={styles.drawerLabel}>What is EXCLUDED (Avoid assumptions)</label>
                    <div className={styles.chipInputRow}>
                      <input
                        type="text"
                        value={excludedInput}
                        onChange={(e) => setExcludedInput(e.target.value)}
                        placeholder="Type an item and press Enter or Add..."
                        className={styles.drawerInput}
                        onKeyDown={(e) => e.key === "Enter" && addExcludedChip()}
                      />
                      <button type="button" onClick={addExcludedChip} className={styles.addChipBtn}>
                        Add
                      </button>
                    </div>
                    <div
                      className={styles.chipsContainer}
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnExcluded}
                      style={{ minHeight: "40px" }}
                    >
                      {selectedCard.excluded && JSON.parse(selectedCard.excluded).map((item: string, index: number) => (
                        <span
                          key={index}
                          className={`${styles.chip} ${styles.excChip}`}
                          draggable
                          onDragStart={(e) => handleDragStartChip(e, "excluded", index, item)}
                          title="Drag to include"
                        >
                          {item}
                          <button type="button" onClick={() => removeExcludedChip(index)} className={styles.removeChipBtn}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      {(!selectedCard.excluded || JSON.parse(selectedCard.excluded).length === 0) && (
                        <p className={styles.noChipsText}>No exclusions explicitly defined.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Q&A THREAD */}
                  {selectedCard.messages && selectedCard.messages.length > 0 ? (
                    <div className={styles.qaThread}>
                      {selectedCard.messages.map((msg) => (
                        <div key={msg.id} className={styles.chatMessage}>
                          <div className={`${styles.chatAvatar} ${msg.sender === "AGENCY" ? styles.agencyAvatar : styles.clientAvatar}`}>
                            {msg.sender === "AGENCY" ? "A" : "C"}
                          </div>
                          <div className={styles.chatContent}>
                            <div className={styles.chatHeader}>
                              <span className={`${styles.chatAuthor} ${msg.sender === "AGENCY" ? styles.authorAgency : styles.authorClient}`}>
                                {msg.sender === "AGENCY" ? "You" : "Client"}
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
                    <p className="muted" style={{ fontStyle: "italic", fontSize: "0.9rem", marginBottom: "20px" }}>
                      No messages yet.
                    </p>
                  )}

                  <div className={styles.replyInputWrapper}>
                    <textarea
                      value={agencyReplyText}
                      onChange={(e) => setAgencyReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className={styles.replyTextarea}
                      rows={2}
                    />
                    <button
                      type="button"
                      onClick={handleAnswerQuestion}
                      className={styles.replySubmitBtn}
                      disabled={!agencyReplyText.trim() || actionPending}
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>

            <footer className={styles.drawerFooter}>
              {selectedCard.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteCard(selectedCard.id!)}
                  className={styles.deleteCardBtn}
                  disabled={actionPending}
                >
                  <Trash2 size={16} /> Delete Card
                </button>
              )}
              <div className={styles.footerRight}>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className={styles.cancelCardBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCard}
                  className={styles.saveCardBtn}
                  disabled={actionPending}
                >
                  Save Card
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
      {/* PROJECT SETTINGS DRAWER */}
      {projectSettingsDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setProjectSettingsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <div>
                <h2 className={styles.drawerTitle}>Project Settings</h2>
                <p className={styles.drawerSubtitle}>Update core project configuration and client attributes.</p>
              </div>
              <button className={styles.closeDrawerBtn} onClick={() => setProjectSettingsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </header>
            <div className={styles.drawerContent}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Project Meta</h3>
              
              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Project Name <span style={{color: "var(--danger)"}}>*</span></label>
                <input 
                  type="text"
                  className={styles.drawerInput}
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                />
              </div>

              <div className={styles.drawerTwoCol}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Project Type</label>
                  <select 
                    className={styles.drawerSelect}
                    value={projectForm.type}
                    onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="CREATIVE">CREATIVE</option>
                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                    <option value="CONSULTING">CONSULTING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Currency</label>
                  <input 
                    type="text"
                    className={styles.drawerInput}
                    value={projectForm.currency}
                    onChange={(e) => setProjectForm({ ...projectForm, currency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Pipeline Status</label>
                <select 
                  className={styles.drawerSelect}
                  value={projectForm.status}
                  onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="IN_REVIEW">IN REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="SIGNED">SIGNED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginTop: 32, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>Client Details</h3>
              
              <div className={styles.drawerTwoCol}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Client Name <span style={{color: "var(--danger)"}}>*</span></label>
                  <input 
                    type="text"
                    className={styles.drawerInput}
                    value={projectForm.clientName}
                    onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Client Email <span style={{color: "var(--danger)"}}>*</span></label>
                  <input 
                    type="email"
                    className={styles.drawerInput}
                    value={projectForm.clientEmail}
                    onChange={(e) => setProjectForm({ ...projectForm, clientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.drawerTwoCol}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Company Name</label>
                  <input 
                    type="text"
                    className={styles.drawerInput}
                    value={projectForm.clientCompany}
                    onChange={(e) => setProjectForm({ ...projectForm, clientCompany: e.target.value })}
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>WhatsApp Number</label>
                  <input 
                    type="text"
                    className={styles.drawerInput}
                    value={projectForm.clientWhatsApp}
                    onChange={(e) => setProjectForm({ ...projectForm, clientWhatsApp: e.target.value })}
                    placeholder="+123456789"
                  />
                </div>
              </div>
            </div>
            <footer className={styles.drawerFooter}>
              <div className={styles.footerRight} style={{ width: "100%", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setProjectSettingsDrawerOpen(false)}
                  className={styles.cancelCardBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjectSettings}
                  className={styles.saveCardBtn}
                  disabled={actionPending}
                >
                  {actionPending ? "Saving..." : "Update Project"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
      {/* PRICING OVERLAY DRAWER */}
      {activeCrForPricing && (
        <div className={styles.drawerOverlay} onClick={() => setActiveCrForPricing(null)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <header className={styles.drawerHeader}>
              <div>
                <h2 className={styles.drawerTitle}>Price Change Request</h2>
                <p className={styles.drawerSubtitle}>Review and specify the resource cost of variance.</p>
              </div>
              <button className={styles.closeDrawerBtn} onClick={() => setActiveCrForPricing(null)}>
                <X size={20} />
              </button>
            </header>
            <div className={styles.drawerContent}>
              <div style={{ background: "var(--background-secondary)", padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <label className={styles.drawerLabel} style={{ color: "var(--muted)" }}>CLIENT REQUEST</label>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6, margin: "8px 0 0 0" }}>{activeCrForPricing.clientRequest}</p>
              </div>

              {activeCrForPricing.scopeCardId && (
                <div style={{ padding: "16px", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", marginBottom: 24 }}>
                  <h4 style={{ marginTop: 0, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
                    <Edit size={14} /> Redefine Target Feature Content
                  </h4>
                  <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 12 }}>Update how this card reads on the client board once this modification applies.</p>
                  <div className={styles.drawerField} style={{ marginBottom: 0 }}>
                    <label className={styles.drawerLabel}>New Scope Description</label>
                    <textarea 
                      className={styles.drawerTextarea}
                      placeholder="Specify revised detailed overview..."
                      value={pricingForm.cardDescription}
                      onChange={(e) => setPricingForm({ ...pricingForm, cardDescription: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Agency Response Message <span style={{color: "var(--danger)"}}>*</span></label>
                <textarea 
                  className={styles.drawerTextarea}
                  placeholder="Describe what you are agreeing to include for this variation..."
                  value={pricingForm.agencyResponse}
                  onChange={(e) => setPricingForm({ ...pricingForm, agencyResponse: e.target.value })}
                  rows={3}
                />
              </div>

              <div className={styles.drawerTwoCol}>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Additional Cost ({project.currency})</label>
                  <input 
                    type="number"
                    className={styles.drawerInput}
                    placeholder="0.00"
                    value={pricingForm.additionalCost}
                    onChange={(e) => setPricingForm({ ...pricingForm, additionalCost: e.target.value })}
                  />
                </div>
                <div className={styles.drawerField}>
                  <label className={styles.drawerLabel}>Estimated Effort</label>
                  <input 
                    type="text"
                    className={styles.drawerInput}
                    placeholder="e.g., +2 Dev Days"
                    value={pricingForm.additionalEffort}
                    onChange={(e) => setPricingForm({ ...pricingForm, additionalEffort: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.drawerField}>
                <label className={styles.drawerLabel}>Internal Agency Notes (Private)</label>
                <textarea 
                  className={styles.drawerTextarea}
                  placeholder="Internal tracking notes not visible to client..."
                  value={pricingForm.internalNotes}
                  onChange={(e) => setPricingForm({ ...pricingForm, internalNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <footer className={styles.drawerFooter}>
              <button 
                type="button" 
                className={styles.cancelCardBtn} 
                onClick={() => setActiveCrForPricing(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.saveCardBtn}
                onClick={handlePriceSubmit}
                disabled={!pricingForm.agencyResponse.trim() || isSavingPrice}
              >
                {isSavingPrice ? "Saving..." : "Send Estimate to Client"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
