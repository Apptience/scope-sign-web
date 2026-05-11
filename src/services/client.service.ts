import { api } from "./api";

export interface CardMessage {
  id: string;
  cardId: string;
  sender: "CLIENT" | "AGENCY";
  message: string;
  createdAt: string;
}

export interface ScopeCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  effort: string | null;
  included: string;
  excluded: string | null;
  type: "IN_SCOPE" | "OUT_OF_SCOPE" | string;
  status: "PENDING" | "APPROVED" | "QUESTION_ASKED" | "ANSWERED" | string;
  messages?: CardMessage[];
  order: number;
}

export interface SectionData {
  id: string;
  title: string;
  order: number;
  scopeCards: ScopeCardData[];
}

export interface AgencyData {
  id: string;
  name: string;
  logoUrl?: string | null;
  currency?: string;
}

export interface ChangeRequestData {
  id: string;
  status: string;
  scopeCardId: string | null;
  clientRequest: string;
  agencyResponse: string | null;
  additionalCost: number | null;
  additionalEffort: string | null;
  timelineImpactDays: number | null;
  clientFeedback: string | null;
  createdAt: string;
}

export interface BoardData {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  status: "DRAFT" | "SENT" | "IN_REVIEW" | "SIGNED" | string;
  signedAt: string | null;
  agency?: AgencyData;
  sections: SectionData[];
  scopeCards: ScopeCardData[];
  changeRequests: ChangeRequestData[];
}

export const ClientService = {
  getBoard: async (token: string): Promise<BoardData> => {
    const res = await api.get("/client.getBoard", {
      headers: { "x-magic-token": token },
    });
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  approveCard: async (token: string, cardId: string): Promise<ScopeCardData> => {
    const res = await api.post(
      "/client.approveCard",
      { cardId },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  askQuestion: async (token: string, cardId: string, question: string): Promise<ScopeCardData> => {
    const res = await api.post(
      "/client.askQuestion",
      { cardId, question },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  undoApproval: async (token: string, cardId: string): Promise<ScopeCardData> => {
    const res = await api.post(
      "/client.undoApproval",
      { cardId },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  signOff: async (token: string, typedName: string): Promise<BoardData> => {
    const res = await api.post(
      "/client.signOff",
      { typedName },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  submitChangeRequest: async (token: string, clientRequest: string, scopeCardId?: string): Promise<{ success: boolean; requestId: string }> => {
    const res = await api.post(
      "/client.submitChangeRequest",
      { clientRequest, scopeCardId },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },

  decideChangeRequest: async (
    token: string, 
    requestId: string, 
    decision: "APPROVED" | "DECLINED", 
    feedback?: string
  ): Promise<{ success: boolean }> => {
    const res = await api.post(
      "/client.decideChangeRequest",
      { requestId, decision, feedback },
      { headers: { "x-magic-token": token } }
    );
    if (res.data.error) throw new Error(res.data.error.message);
    return res.data.result.data;
  },
};
