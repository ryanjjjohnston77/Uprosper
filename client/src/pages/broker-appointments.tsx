import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Clock, CalendarCheck, Plus, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistance, format, isPast, parseISO } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Enquiry {
  id: number;
  clientId: number;
  brokerUserId: string;
  productType: string;
  status: string;
  read: boolean;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingStatus: string | null;
  meetingLink: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  change_requested: { label: "Change Requested", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-600 hover:bg-gray-100" },
};

const MEETING_TOPICS = [
  { value: "Mortgage", label: "Mortgage" },
  { value: "Home Insurance", label: "Home Insurance" },
  { value: "Life Insurance", label: "Life Insurance" },
  { value: "Pension", label: "Pension" },
  { value: "Investments", label: "Investments" },
  { value: "Wealth Planning", label: "Wealth Planning" },
  { value: "General Review", label: "General Review" },
];

export default function BrokerAppointments() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

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

  const { data: enquiries = [] } = useQuery<Enquiry[]>({
    queryKey: ["broker-enquiries"],
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/broker/enquiries");
      return res.json();
    },
    enabled: !!user && user.role === "broker",
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: { clientId: number; productType: string; meetingDate: string; meetingTime: string; meetingLink?: string }) => {
      const res = await apiRequest("POST", "/api/broker/schedule-meeting", data);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Meeting scheduled and notification sent to client!");
      queryClient.invalidateQueries({ queryKey: ["broker-enquiries"] });
      setScheduleOpen(false);
      setSelectedClientId("");
      setSelectedTopic("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingLink("");
    },
    onError: () => {
      toast.error("Failed to schedule meeting. Please try again.");
    },
  });

  const appointments = enquiries.filter((e) => e.meetingDate);

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = a.meetingDate ? new Date(a.meetingDate).getTime() : 0;
    const dateB = b.meetingDate ? new Date(b.meetingDate).getTime() : 0;
    const nowMs = Date.now();
    const aIsPast = dateA < nowMs;
    const bIsPast = dateB < nowMs;
    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
    return aIsPast ? dateB - dateA : dateA - dateB;
  });

  const upcomingCount = sortedAppointments.filter(
    (a) => a.meetingDate && !isPast(parseISO(a.meetingDate))
  ).length;

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusBadge = (meetingStatus: string | null) => {
    const status = meetingStatus || "scheduled";
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
    return (
      <Badge variant="secondary" className={config.className} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const formatMeetingDateTime = (date: string | null, time: string | null) => {
    if (!date) return "—";
    try {
      const formatted = format(parseISO(date), "EEE, dd MMM yyyy");
      return time ? `${formatted} at ${time}` : formatted;
    } catch {
      return date;
    }
  };

  const handleScheduleSubmit = () => {
    if (!selectedClientId || !selectedTopic || !meetingDate || !meetingTime) return;
    scheduleMeetingMutation.mutate({
      clientId: parseInt(selectedClientId),
      productType: selectedTopic,
      meetingDate,
      meetingTime,
      ...(meetingLink.trim() ? { meetingLink: meetingLink.trim() } : {}),
    });
  };

  if (!user || user.role !== "broker") {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Please log in as a broker to view appointments.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/broker")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">Appointments</h1>
              <p className="text-sm text-muted-foreground">View all scheduled meetings with your clients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {upcomingCount > 0 && (
              <Badge variant="default" className="rounded-full px-2.5 bg-blue-600">
                {upcomingCount} upcoming
              </Badge>
            )}
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm flex-1 sm:flex-none"
              onClick={() => setScheduleOpen(true)}
              data-testid="button-schedule-meeting"
            >
              <Plus className="h-4 w-4" /> Schedule Meeting
            </Button>
          </div>
        </div>

        <Card className="bg-white shadow-md border-none">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-heading font-bold text-gray-900">
                All Appointments ({sortedAppointments.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {sortedAppointments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No appointments scheduled yet</p>
                <p className="text-sm">Schedule a meeting using the button above, or from client enquiries.</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedAppointments.map((appointment) => {
                  const meetingIsPast = appointment.meetingDate
                    ? isPast(parseISO(appointment.meetingDate))
                    : false;
                  return (
                    <div
                      key={appointment.id}
                      className={`p-4 ${meetingIsPast ? "opacity-60" : ""}`}
                      data-testid={`appointment-row-${appointment.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate" data-testid={`appointment-client-${appointment.id}`}>
                            {getClientName(appointment.clientId)}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize" data-testid={`appointment-product-${appointment.id}`}>
                            {appointment.productType.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div data-testid={`appointment-status-${appointment.id}`}>
                          {getStatusBadge(appointment.meetingStatus)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm" data-testid={`appointment-date-${appointment.id}`}>
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{formatMeetingDateTime(appointment.meetingDate, appointment.meetingTime)}</span>
                        {appointment.meetingDate && (
                          <span className="text-xs text-muted-foreground">
                            ({formatDistance(parseISO(appointment.meetingDate), new Date(), { addSuffix: true })})
                          </span>
                        )}
                      </div>
                      {appointment.meetingLink && (
                        <a
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline mt-1 inline-block"
                          data-testid={`link-join-appointment-${appointment.id}`}
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={scheduleOpen} onOpenChange={(open) => {
        if (!open) {
          setScheduleOpen(false);
          setSelectedClientId("");
          setSelectedTopic("");
          setMeetingDate("");
          setMeetingTime("");
          setMeetingLink("");
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <DialogTitle className="text-xl font-heading font-bold text-gray-900">Schedule Meeting</DialogTitle>
                <DialogDescription className="text-muted-foreground">Book a meeting with one of your clients</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-meeting-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Meeting Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="bg-gray-50 border-gray-200" data-testid="select-meeting-topic">
                  <SelectValue placeholder="What is the meeting regarding?" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TOPICS.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Meeting Link (Optional)</Label>
              <Input
                type="url"
                placeholder="https://zoom.us/j/... or Google Meet link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="bg-gray-50 border-gray-200"
                data-testid="input-meeting-link"
              />
              <p className="text-xs text-muted-foreground mt-1">Paste your Zoom, Teams, or Google Meet link</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-700" /> Pick a Date & Time
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Date</Label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white"
                    data-testid="input-schedule-date"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Time</Label>
                  <Input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="bg-white"
                    data-testid="input-schedule-time"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setScheduleOpen(false);
                  setSelectedClientId("");
                  setSelectedTopic("");
                  setMeetingDate("");
                  setMeetingTime("");
                  setMeetingLink("");
                }}
                data-testid="button-cancel-schedule"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm"
                disabled={!selectedClientId || !selectedTopic || !meetingDate || !meetingTime || scheduleMeetingMutation.isPending}
                onClick={handleScheduleSubmit}
                data-testid="button-confirm-schedule-meeting"
              >
                <Send className="w-4 h-4" /> {scheduleMeetingMutation.isPending ? "Sending..." : "Send to Client"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
