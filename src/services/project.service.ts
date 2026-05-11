import { api } from "./api";

export interface CreateProjectInput {
  name: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  projectType: string;
  currency: string;
}

export const projectService = {
  async list(input: { search?: string; status?: string; type?: string } = {}) {
    const query = encodeURIComponent(JSON.stringify(input));
    const response = await api.get(`/project.list?input=${query}`);
    return response.data;
  },

  async create(input: CreateProjectInput) {
    const response = await api.post("/project.create", input);
    return response.data;
  },

  async getById(id: string) {
    const query = encodeURIComponent(JSON.stringify({ id }));
    const response = await api.get(`/project.getById?input=${query}`);
    return response.data;
  },

  async priceChangeRequest(input: {
    id: string;
    agencyResponse: string;
    additionalEffort?: string;
    additionalCost?: number;
    timelineImpactDays?: number;
    internalNotes?: string;
    cardDescription?: string;
    cardIncluded?: string[];
    cardExcluded?: string[];
  }) {
    const response = await api.post("/changeRequest.price", input);
    return response.data;
  },

  async markCrInvoiced(id: string) {
    const response = await api.post("/changeRequest.markAsInvoiced", { id });
    return response.data;
  },

  async update(input: {
    id: string;
    name?: string;
    clientName?: string;
    clientEmail?: string;
    clientCompany?: string;
    clientWhatsApp?: string;
    type?: string;
    currency?: string;
    status?: string;
  }) {
    const response = await api.post("/project.update", input);
    return response.data;
  },
};

