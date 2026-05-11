import { api } from "./api";

export interface NotificationItem {
  id: string;
  agencyId: string;
  projectId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  project?: {
    name: string;
  };
}

export interface LatestNotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationService = {
  async getLatest(): Promise<LatestNotificationsResponse> {
    const response = await api.get("/notification.getLatest");
    if (response.data.error) throw new Error(response.data.error.message);
    return response.data.result.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.post("/notification.markAllAsRead", {});
    if (response.data.error) throw new Error(response.data.error.message);
    return response.data.result.data;
  },
};
