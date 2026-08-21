import type { Client, JourneyStep, Reward, Offer, Notification } from "@shared/schema";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

export const api = {
  clients: {
    getAll: () => fetcher<Client[]>('/api/clients'),
    getById: (id: number) => fetcher<Client>(`/api/clients/${id}`),
    create: (data: any) => fetcher<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => fetcher<Client>(`/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },
  
  journey: {
    getSteps: (clientId: number) => fetcher<JourneyStep[]>(`/api/clients/${clientId}/journey`),
    createStep: (data: any) => fetcher<JourneyStep>('/api/journey-steps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStep: (id: number, data: any) => fetcher<JourneyStep>(`/api/journey-steps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },
  
  rewards: {
    getByClient: (clientId: number) => fetcher<Reward[]>(`/api/clients/${clientId}/rewards`),
    claim: (id: number) => fetcher<Reward>(`/api/rewards/${id}/claim`, {
      method: 'POST',
    }),
  },
  
  offers: {
    getByClient: (clientId: number) => fetcher<Offer[]>(`/api/clients/${clientId}/offers`),
  },
  
  notifications: {
    getByClient: (clientId: number) => fetcher<Notification[]>(`/api/clients/${clientId}/notifications`),
    markRead: (id: number) => fetcher<Notification>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),
  },
};
