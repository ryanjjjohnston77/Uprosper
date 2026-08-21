import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, ClipboardList, Bell, Calendar, Inbox, Megaphone } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: number;
  clientId: number;
  content: string;
  subject?: string;
  senderType: string;
  read: boolean;
  createdAt: string;
}

interface Enquiry {
  id: number;
  clientId: number;
  brokerUserId: string;
  productType: string;
  note: string | null;
  status: string;
  read: boolean;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingStatus: string | null;
  createdAt: string;
}

interface BrokerNotification {
  id: number;
  brokerUserId: string;
  type: string;
  title: string;
  message: string;
  enquiryId: number | null;
  read: boolean;
  createdAt: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
}

type NotificationType = "message" | "enquiry" | "reminder" | "announcement";
type FilterTab = "all" | "messages" | "enquiries" | "reminders" | "announcements";

interface UnifiedNotification {
  id: number;
  type: NotificationType;
  title: string;
  detail: string;
  read: boolean;
  createdAt: string;
  originalId: number;
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "messages", label: "Messages" },
  { key: "enquiries", label: "Enquiries" },
  { key: "reminders", label: "Reminders" },
  { key: "announcements", label: "Announcements" },
];

export default function BrokerNotifications() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Shell>
    );
  }

  if (!user || user.role !== "broker") {
    setLocation("/login");
    return null;
  }

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["broker-clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/broker/my-clients");
      return res.json();
    },
    enabled: !!user && user.role === "broker",
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["broker-messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/broker/messages");
      return res.json();
    },
    enabled: !!user && user.role === "broker",
    refetchInterval: 5000,
  });

  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ["broker-enquiries"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/broker/enquiries");
      return res.json();
    },
    enabled: !!user && user.role === "broker",
    refetchInterval: 5000,
  });

  const { data: brokerNotifications = [] } = useQuery<BrokerNotification[]>({
    queryKey: ["broker-notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/broker/notifications");
      return res.json();
    },
    enabled: !!user && user.role === "broker",
    refetchInterval: 30000,
  });

  const { data: companyAnnouncements = [] } = useQuery<{ id: number; title: string; content: string; priority: string; createdAt: string }[]>({
    queryKey: ["broker-company-announcements"],
    queryFn: async () => {
      const res = await fetch("/api/broker/company-announcements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && user.role === "broker" && !!user.companyId,
    refetchInterval: 5000,
  });

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const markMessageReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("POST", `/api/messages/${messageId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-messages"] });
    },
  });

  const markEnquiryReadMutation = useMutation({
    mutationFn: async (enquiryId: number) => {
      const res = await apiRequest("POST", `/api/enquiries/${enquiryId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-enquiries"] });
    },
  });

  const markBrokerNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/broker/notifications/${notificationId}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-notifications"] });
    },
  });

  const clientMessages = messages.filter((m) => m.senderType === "client");

  const unifiedNotifications: UnifiedNotification[] = [
    ...clientMessages.map((m) => ({
      id: m.id,
      type: "message" as NotificationType,
      title: m.subject || `Message from ${getClientName(m.clientId)}`,
      detail: m.content.length > 100 ? m.content.slice(0, 100) + "…" : m.content,
      read: m.read,
      createdAt: m.createdAt,
      originalId: m.id,
    })),
    ...enquiries.map((e) => ({
      id: e.id + 100000,
      type: "enquiry" as NotificationType,
      title: `${e.productType.replace(/_/g, " ")} enquiry`,
      detail: `From ${getClientName(e.clientId)} · Status: ${e.status}${e.meetingDate ? ` · Meeting: ${e.meetingDate}` : ""}${e.note ? ` · Note: "${e.note}"` : ""}`,
      read: e.read,
      createdAt: e.createdAt,
      originalId: e.id,
    })),
    ...brokerNotifications.map((bn) => ({
      id: bn.id + 200000,
      type: "reminder" as NotificationType,
      title: bn.title,
      detail: bn.message,
      read: bn.read,
      createdAt: bn.createdAt,
      originalId: bn.id,
    })),
    ...companyAnnouncements.map((ca) => ({
      id: ca.id + 300000,
      type: "announcement" as NotificationType,
      title: ca.title,
      detail: `${ca.priority === "urgent" ? "[URGENT] " : ""}${ca.content.length > 100 ? ca.content.slice(0, 100) + "…" : ca.content}`,
      read: true,
      createdAt: ca.createdAt,
      originalId: ca.id,
    })),
  ];

  const filteredNotifications = unifiedNotifications
    .filter((n) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "messages") return n.type === "message";
      if (activeFilter === "enquiries") return n.type === "enquiry";
      if (activeFilter === "reminders") return n.type === "reminder";
      if (activeFilter === "announcements") return n.type === "announcement";
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = unifiedNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: UnifiedNotification) => {
    if (notification.read) return;
    if (notification.type === "message") {
      markMessageReadMutation.mutate(notification.originalId);
    } else if (notification.type === "enquiry") {
      markEnquiryReadMutation.mutate(notification.originalId);
    } else if (notification.type === "reminder") {
      markBrokerNotificationReadMutation.mutate(notification.originalId);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case "enquiry":
        return <ClipboardList className="h-5 w-5 text-blue-600" />;
      case "reminder":
        return <Bell className="h-5 w-5 text-violet-600" />;
      case "announcement":
        return <Megaphone className="h-5 w-5 text-amber-600" />;
    }
  };

  const getTypeBgClass = (type: NotificationType, read: boolean) => {
    if (read) return "bg-white hover:bg-gray-50";
    switch (type) {
      case "message":
        return "bg-green-50/60 hover:bg-green-50";
      case "enquiry":
        return "bg-blue-50/60 hover:bg-blue-50";
      case "reminder":
        return "bg-violet-50/60 hover:bg-violet-50";
      case "announcement":
        return "bg-amber-50/60 hover:bg-amber-50";
    }
  };

  const getUnreadDotClass = (type: NotificationType) => {
    switch (type) {
      case "message":
        return "bg-green-500";
      case "enquiry":
        return "bg-blue-500";
      case "reminder":
        return "bg-violet-500";
      case "announcement":
        return "bg-amber-500";
    }
  };

  if (!user || user.role !== "broker") {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Please log in as a broker to view notifications.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/broker")}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Notification History</h1>
            <p className="text-muted-foreground">View all messages, enquiries and reminders</p>
          </div>
          {unreadCount > 0 && (
            <span className="ml-auto inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white" data-testid="badge-unread-count">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap" data-testid="filter-tabs">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={activeFilter === tab.key ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveFilter(tab.key)}
              data-testid={`filter-tab-${tab.key}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <Card className="bg-white shadow-md border-none">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-heading font-bold text-gray-900">
                {activeFilter === "all" ? "All Notifications" : FILTER_TABS.find((t) => t.key === activeFilter)?.label} ({filteredNotifications.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground" data-testid="empty-state">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No notifications yet</p>
                <p className="text-sm">When you receive messages, enquiries or reminders they will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <button
                    key={`${notification.type}-${notification.originalId}`}
                    className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${getTypeBgClass(notification.type, notification.read)}`}
                    onClick={() => handleNotificationClick(notification)}
                    data-testid={`notification-item-${notification.type}-${notification.originalId}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold capitalize ${notification.read ? "text-gray-700" : "text-gray-900"}`} data-testid={`notification-title-${notification.type}-${notification.originalId}`}>
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className={`inline-block h-2 w-2 rounded-full animate-pulse ${getUnreadDotClass(notification.type)}`} data-testid={`unread-dot-${notification.type}-${notification.originalId}`} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate" data-testid={`notification-detail-${notification.type}-${notification.originalId}`}>
                        {notification.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5" data-testid={`notification-time-${notification.type}-${notification.originalId}`}>
                      {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
