import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Search, Mail, Phone, MoreHorizontal, MessageSquare, Sparkles, Pencil, Check, Lock, ChevronDown } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  mortgageValue: string;
  mortgageTerm: number | null;
  interestRate: string | null;
  monthlyPayment: string | null;
  renewalDate: string;
  lastContact: string | null;
  createdAt: string | null;
}

interface JourneyStep {
  id: number;
  clientId: number;
  stepId: number;
  stepTitle: string;
  status: string;
  completedAt: string | null;
}

const JOURNEY_STEPS = [
  { stepId: 1, stepTitle: "Mortgage Secured", icon: "🏡" },
  { stepId: 2, stepTitle: "Home Insurance", icon: "🏠" },
  { stepId: 3, stepTitle: "Life Insurance", icon: "🛡️" },
  { stepId: 4, stepTitle: "Wealth Review", icon: "💰" },
  { stepId: 5, stepTitle: "Will & Succession", icon: "📜" },
];

export default function BrokerClients() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [bulkOfferOpen, setBulkOfferOpen] = useState(false);
  const [bulkOfferData, setBulkOfferData] = useState({ offerType: "", message: "" });
  const [bulkSending, setBulkSending] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPopupOpen, setClientPopupOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [sendOfferOpen, setSendOfferOpen] = useState(false);
  const [messageData, setMessageData] = useState({ clientId: 0, clientName: "", subject: "", body: "" });
  const [offerData, setOfferData] = useState({ clientId: 0, clientName: "", offerType: "", message: "" });
  const [editingRenewalDate, setEditingRenewalDate] = useState(false);
  const [renewalDateValue, setRenewalDateValue] = useState("");
  const [editingMortgageValue, setEditingMortgageValue] = useState(false);
  const [mortgageValueEdit, setMortgageValueEdit] = useState("");
  const [editingInterestRate, setEditingInterestRate] = useState(false);
  const [interestRateEdit, setInterestRateEdit] = useState("");
  const [editingMonthlyPayment, setEditingMonthlyPayment] = useState(false);
  const [monthlyPaymentEdit, setMonthlyPaymentEdit] = useState("");
  const [journeyOpen, setJourneyOpen] = useState(false);

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['broker-clients'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/my-clients');
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
  });

  const toggleClientStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { status });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, status: updatedClient.status });
      }
      toast.success(`Client marked as ${updatedClient.status}`);
    },
    onError: () => {
      toast.error("Failed to update client status.");
    }
  });

  const updateRenewalDateMutation = useMutation({
    mutationFn: async ({ clientId, renewalDate }: { clientId: number; renewalDate: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { renewalDate });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, renewalDate: updatedClient.renewalDate });
      }
      toast.success("Renewal date updated!");
      setEditingRenewalDate(false);
    },
    onError: () => {
      toast.error("Failed to update renewal date.");
    }
  });

  const updateMortgageValueMutation = useMutation({
    mutationFn: async ({ clientId, mortgageValue }: { clientId: number; mortgageValue: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { mortgageValue });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, mortgageValue: updatedClient.mortgageValue });
      }
      toast.success("Mortgage value updated!");
      setEditingMortgageValue(false);
    },
    onError: () => {
      toast.error("Failed to update mortgage value.");
    }
  });

  const updateInterestRateMutation = useMutation({
    mutationFn: async ({ clientId, interestRate }: { clientId: number; interestRate: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { interestRate });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, interestRate: updatedClient.interestRate });
      }
      toast.success("Interest rate updated!");
      setEditingInterestRate(false);
    },
    onError: () => {
      toast.error("Failed to update interest rate.");
    }
  });

  const updateMonthlyPaymentMutation = useMutation({
    mutationFn: async ({ clientId, monthlyPayment }: { clientId: number; monthlyPayment: string }) => {
      const res = await apiRequest('PATCH', `/api/clients/${clientId}`, { monthlyPayment });
      return res.json();
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ['broker-clients'] });
      if (selectedClient) {
        setSelectedClient({ ...selectedClient, monthlyPayment: updatedClient.monthlyPayment });
      }
      toast.success("Monthly payment updated!");
      setEditingMonthlyPayment(false);
    },
    onError: () => {
      toast.error("Failed to update monthly payment.");
    }
  });

  const { data: clientJourneySteps = [], isFetching: isJourneyFetching } = useQuery<JourneyStep[]>({
    queryKey: ['client-journey', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const res = await fetch(`/api/clients/${selectedClient.id}/journey`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedClient && clientPopupOpen,
    staleTime: 0, // Always fetch fresh data when popup opens
  });

  const { data: allJourneySteps = [] } = useQuery<JourneyStep[]>({
    queryKey: ['broker-clients-journeys'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/my-clients/journeys');
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
  });

  const journeyStepsByClient = new Map<number, JourneyStep[]>();
  for (const step of allJourneySteps) {
    const list = journeyStepsByClient.get(step.clientId) ?? [];
    list.push(step);
    journeyStepsByClient.set(step.clientId, list);
  }

  const toggleJourneyStepMutation = useMutation({
    mutationFn: async ({ clientId, stepId, stepTitle }: { clientId: number; stepId: number; stepTitle: string }) => {
      const res = await apiRequest('POST', `/api/broker/clients/${clientId}/journey-toggle`, { stepId, stepTitle });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-journey', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['broker-clients-journeys'] });
    },
    onError: () => {
      toast.error("Failed to update journey step.");
    }
  });

  const isStepCompleted = (stepId: number) => {
    const step = clientJourneySteps.find(s => s.stepId === stepId);
    return step?.status === 'completed';
  };

  const isStepUnlocked = (stepId: number) => {
    const completedIds = clientJourneySteps.filter(s => s.status === 'completed').map(s => s.stepId);
    const maxCompletedId = completedIds.length > 0 ? Math.max(...completedIds) : 0;
    const maxUnlockedId = Math.max(2, maxCompletedId + 2);
    return stepId <= maxUnlockedId;
  };

  const getCompletedCountForClient = (clientId: number) => {
    const steps = journeyStepsByClient.get(clientId) ?? [];
    return steps.filter(s => s.status === 'completed').length;
  };

  const isStepCompletedForClient = (clientId: number, stepId: number) => {
    const steps = journeyStepsByClient.get(clientId) ?? [];
    return steps.find(s => s.stepId === stepId)?.status === 'completed';
  };

  const isStepUnlockedForClient = (clientId: number, stepId: number) => {
    const steps = journeyStepsByClient.get(clientId) ?? [];
    const completedIds = steps.filter(s => s.status === 'completed').map(s => s.stepId);
    const maxCompletedId = completedIds.length > 0 ? Math.max(...completedIds) : 0;
    const maxUnlockedId = Math.max(2, maxCompletedId + 2);
    return stepId <= maxUnlockedId;
  };

  const sortedClients = [...clients]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const filteredClients = sortedClients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/broker/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: messageData.clientId,
          subject: messageData.subject || "Message from your broker",
          content: messageData.body
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      toast.success('Message sent successfully!');
      setSendMessageOpen(false);
      setMessageData({ clientId: 0, clientName: "", subject: "", body: "" });
      queryClient.invalidateQueries({ queryKey: ['broker-messages'] });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const offerTitles: Record<string, string> = {
        reward: "You have received a reward 🎉",
        fixed_rate_ending: "Your fixed-rate mortgage ends in 3 months ⏰",
        moving_house: "Thinking of moving or upsizing? 🏡",
        home_insurance: "Explore Home Insurance 🏠",
        life_insurance: "Explore Life Insurance 🛡️",
        wealth: "Wealth Opportunity 💡"
      };
      const res = await fetch('/api/broker/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId: offerData.clientId,
          type: offerData.offerType,
          title: offerTitles[offerData.offerType] || "New Notification",
          message: offerData.message
        })
      });
      if (!res.ok) throw new Error('Failed to send offer');
      toast.success('Offer sent successfully!');
      setSendOfferOpen(false);
      setOfferData({ clientId: 0, clientName: "", offerType: "", message: "" });
    } catch (error) {
      toast.error('Failed to send offer. Please try again.');
    }
  };

  const toggleSelectClient = (clientId: number) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleBulkSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSending(true);
    try {
      const offerTitles: Record<string, string> = {
        reward: "You have received a reward 🎉",
        fixed_rate_ending: "Your fixed-rate mortgage ends in 3 months ⏰",
        moving_house: "Thinking of moving or upsizing? 🏡",
        home_insurance: "Explore Home Insurance 🏠",
        life_insurance: "Explore Life Insurance 🛡️",
        wealth: "Wealth Opportunity 💡"
      };
      const ids = Array.from(selectedClientIds);
      const results = await Promise.allSettled(ids.map(async (clientId) => {
        const res = await fetch('/api/broker/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            clientId,
            type: bulkOfferData.offerType,
            title: offerTitles[bulkOfferData.offerType] || "New Notification",
            message: bulkOfferData.message
          })
        });
        if (!res.ok) throw new Error(`Failed for client ${clientId}`);
        return clientId;
      }));
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed === 0) {
        toast.success(`Offer sent to ${succeeded} client${succeeded > 1 ? 's' : ''}!`);
        setBulkOfferOpen(false);
        setBulkOfferData({ offerType: "", message: "" });
        setSelectedClientIds(new Set());
      } else if (succeeded > 0) {
        toast.error(`Sent to ${succeeded} client${succeeded > 1 ? 's' : ''}, but ${failed} failed. Please retry the remaining.`);
        const failedIds = results.map((r, i) => r.status === 'rejected' ? ids[i] : null).filter(Boolean) as number[];
        setSelectedClientIds(new Set(failedIds));
      } else {
        toast.error('Failed to send offers. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to send offers. Please try again.');
    } finally {
      setBulkSending(false);
    }
  };

  if (authLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Shell>
    );
  }

  if (!user || user.role !== 'broker') {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-gray-500">Please log in as a broker to view this page.</p>
          <Button onClick={() => setLocation('/login')} className="mt-4" data-testid="button-go-to-login">Go to Login</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
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
            <h1 className="text-2xl font-heading font-bold text-gray-900">All Clients</h1>
            <p className="text-muted-foreground">Manage your complete client portfolio</p>
          </div>
        </div>

        <Card className="bg-white shadow-md border-none">
          <CardHeader className="pb-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-heading font-bold text-gray-900">
                  Client List
                </CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {clients.length} total
                </Badge>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients by name, email, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-clients"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{searchQuery ? "No clients match your search" : "No clients yet"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-10 pl-4">
                      <input
                        type="checkbox"
                        checked={filteredClients.length > 0 && selectedClientIds.size === filteredClients.length}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedClientIds.size > 0 && selectedClientIds.size < filteredClients.length;
                        }}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead style={{ paddingLeft: '8px' }}>Client Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Journey</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer" 
                      data-testid={`row-client-${client.id}`}
                      onClick={() => {
                        // Remove journey query cache to force fresh fetch for new client
                        queryClient.removeQueries({ queryKey: ['client-journey'] });
                        setSelectedClient(client);
                        setClientPopupOpen(true);
                      }}
                    >
                      <TableCell className="w-10 pl-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedClientIds.has(client.id)}
                          onChange={() => toggleSelectClient(client.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                          data-testid={`checkbox-client-${client.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900" style={{ paddingLeft: '8px' }} data-testid={`text-client-name-${client.id}`}>
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          client.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                          client.status === "Pending" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                          "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        }>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                              data-testid={`button-journey-popover-${client.id}`}
                              aria-label={`Update prosperity journey for ${client.name}`}
                            >
                              <div className="flex items-center gap-1">
                                {JOURNEY_STEPS.map((step) => {
                                  const completed = isStepCompletedForClient(client.id, step.stepId);
                                  return (
                                    <span
                                      key={step.stepId}
                                      className={`h-2 w-2 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-200'}`}
                                      data-testid={`dot-journey-${client.id}-${step.stepId}`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-xs text-gray-500 font-medium" data-testid={`text-journey-progress-${client.id}`}>
                                {getCompletedCountForClient(client.id)}/{JOURNEY_STEPS.length}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-3" align="start">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#0f766e' }}>
                                  Prosperity Journey
                                </p>
                                <span className="text-xs text-gray-500" data-testid={`text-journey-popover-progress-${client.id}`}>
                                  {getCompletedCountForClient(client.id)} of {JOURNEY_STEPS.length} done
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {JOURNEY_STEPS.map((step) => {
                                  const completed = isStepCompletedForClient(client.id, step.stepId);
                                  const unlocked = isStepUnlockedForClient(client.id, step.stepId);
                                  return (
                                    <button
                                      key={step.stepId}
                                      type="button"
                                      disabled={!unlocked || toggleJourneyStepMutation.isPending}
                                      onClick={() => {
                                        if (!unlocked) return;
                                        toggleJourneyStepMutation.mutate({
                                          clientId: client.id,
                                          stepId: step.stepId,
                                          stepTitle: step.stepTitle,
                                        });
                                      }}
                                      className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                                        completed
                                          ? 'bg-green-50 border-green-300 text-green-700'
                                          : unlocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                            : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                      }`}
                                      data-testid={`toggle-row-journey-${client.id}-${step.stepId}`}
                                    >
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        completed
                                          ? 'bg-green-500 border-green-500'
                                          : unlocked
                                            ? 'border-gray-300'
                                            : 'border-gray-200'
                                      }`}>
                                        {completed && <Check className="h-3 w-3 text-white" />}
                                        {!completed && !unlocked && <Lock className="h-2.5 w-2.5 text-gray-300" />}
                                      </div>
                                      <span className="text-sm font-medium">
                                        {step.icon} {step.stepTitle}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className={client.renewalDate.includes("2024") ? "text-amber-600 font-medium" : ""}>
                        {client.renewalDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {client.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-primary" 
                            data-testid={`button-email-${client.id}`}
                            onClick={() => window.location.href = `mailto:${client.email}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-primary" 
                            data-testid={`button-phone-${client.id}`}
                            onClick={() => client.phone && (window.location.href = `tel:${client.phone}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400" 
                            data-testid={`button-more-${client.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Remove journey query cache to force fresh fetch for new client
                              queryClient.removeQueries({ queryKey: ['client-journey'] });
                              setSelectedClient(client);
                              setClientPopupOpen(true);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setLocation("/broker")}
          data-testid="button-back-to-dashboard-bottom"
        >
          Back to Dashboard
        </Button>

        {/* Client Details Popup */}
        <Dialog open={clientPopupOpen} onOpenChange={(open) => {
          setClientPopupOpen(open);
          if (!open) {
            setEditingRenewalDate(false);
            setEditingMortgageValue(false);
            setEditingInterestRate(false);
            setEditingMonthlyPayment(false);
            setJourneyOpen(false);
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading flex items-center gap-2">
                {selectedClient?.name}
              </DialogTitle>
              <DialogDescription>
                Client details and quick actions
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                {/* Personal Info bento */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}
                  data-testid="bento-personal-info"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#0f766e' }}>Personal Info</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                      <button
                        onClick={() => {
                          const newStatus = selectedClient.status === "Active" ? "Inactive" : "Active";
                          toggleClientStatusMutation.mutate({ clientId: selectedClient.id, status: newStatus });
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedClient.status === "Active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        data-testid="button-toggle-client-status"
                      >
                        <div className={`w-7 h-4 rounded-full relative transition-colors ${
                          selectedClient.status === "Active" ? "bg-green-500" : "bg-gray-300"
                        }`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${
                            selectedClient.status === "Active" ? "left-3.5" : "left-0.5"
                          }`} />
                        </div>
                        {selectedClient.status === "Active" ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-gray-700 text-sm break-all" data-testid="text-client-email">{selectedClient.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="text-gray-700 text-sm" data-testid="text-client-phone">
                        {selectedClient.phone || <span className="text-gray-400">Not provided</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mortgage Details bento */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}
                  data-testid="bento-mortgage-details"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#0f766e' }}>Mortgage Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Mortgage Value</p>
                      {editingMortgageValue ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input
                              type="number"
                              value={mortgageValueEdit}
                              onChange={(e) => setMortgageValueEdit(e.target.value)}
                              placeholder="e.g. 250000"
                              className="h-8 text-sm pl-6"
                              data-testid="input-mortgage-value"
                            />
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              if (mortgageValueEdit.trim()) {
                                updateMortgageValueMutation.mutate({
                                  clientId: selectedClient.id,
                                  mortgageValue: mortgageValueEdit.trim()
                                });
                              }
                            }}
                            data-testid="button-save-mortgage-value"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700">
                            £{Number(selectedClient.mortgageValue).toLocaleString()}
                          </p>
                          <button
                            onClick={() => {
                              setMortgageValueEdit(selectedClient.mortgageValue);
                              setEditingMortgageValue(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-mortgage-value"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Interest Rate</p>
                      {editingInterestRate ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={interestRateEdit}
                              onChange={(e) => setInterestRateEdit(e.target.value)}
                              placeholder="e.g. 4.25"
                              className="h-8 text-sm pr-6"
                              data-testid="input-interest-rate"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              updateInterestRateMutation.mutate({
                                clientId: selectedClient.id,
                                interestRate: interestRateEdit.trim()
                              });
                            }}
                            data-testid="button-save-interest-rate"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700" data-testid="text-interest-rate">
                            {selectedClient.interestRate
                              ? `${parseFloat(selectedClient.interestRate)}%`
                              : <span className="text-gray-400">Not set</span>}
                          </p>
                          <button
                            onClick={() => {
                              setInterestRateEdit(selectedClient.interestRate ?? "");
                              setEditingInterestRate(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-interest-rate"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Payment</p>
                      {editingMonthlyPayment ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={monthlyPaymentEdit}
                              onChange={(e) => setMonthlyPaymentEdit(e.target.value)}
                              placeholder="e.g. 1542"
                              className="h-8 text-sm pl-6"
                              data-testid="input-monthly-payment"
                            />
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              updateMonthlyPaymentMutation.mutate({
                                clientId: selectedClient.id,
                                monthlyPayment: monthlyPaymentEdit.trim()
                              });
                            }}
                            data-testid="button-save-monthly-payment"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-700" data-testid="text-monthly-payment">
                            {selectedClient.monthlyPayment
                              ? `£${Number(selectedClient.monthlyPayment).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                              : <span className="text-gray-400">Not set</span>}
                          </p>
                          <button
                            onClick={() => {
                              setMonthlyPaymentEdit(selectedClient.monthlyPayment ?? "");
                              setEditingMonthlyPayment(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-monthly-payment"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Renewal Date</p>
                      {editingRenewalDate ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={renewalDateValue}
                            onChange={(e) => setRenewalDateValue(e.target.value)}
                            placeholder="e.g., March 2025"
                            className="h-8 text-sm"
                            data-testid="input-renewal-date"
                          />
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-300 hover:brightness-110"
                            style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                            onClick={() => {
                              if (renewalDateValue.trim()) {
                                updateRenewalDateMutation.mutate({
                                  clientId: selectedClient.id,
                                  renewalDate: renewalDateValue.trim()
                                });
                              }
                            }}
                            data-testid="button-save-renewal-date"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${selectedClient.renewalDate?.includes("2024") ? "text-amber-600" : "text-gray-700"}`}>
                            {selectedClient.renewalDate}
                          </p>
                          <button
                            onClick={() => {
                              setRenewalDateValue(selectedClient.renewalDate);
                              setEditingRenewalDate(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            data-testid="button-edit-renewal-date"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prosperity Journey collapsible */}
                {(() => {
                  const unlockedCount = JOURNEY_STEPS.filter(s => isStepUnlocked(s.stepId)).length;
                  const totalCount = JOURNEY_STEPS.length;
                  return (
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#ffffff', border: '1px solid rgba(68,186,132,0.18)' }}
                      data-testid="bento-prosperity-journey"
                    >
                      <button
                        type="button"
                        onClick={() => setJourneyOpen((v) => !v)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        aria-expanded={journeyOpen}
                        data-testid="button-toggle-journey-section"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#0f766e' }}>Prosperity Journey</p>
                          <span className="text-xs text-gray-500" data-testid="text-journey-count">
                            {unlockedCount} of {totalCount} unlocked
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${journeyOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-200 ease-out ${journeyOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                      >
                        <div className="overflow-hidden">
                        <div className="px-4 pb-4">
                          {isJourneyFetching ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {JOURNEY_STEPS.map((step) => {
                                const completed = isStepCompleted(step.stepId);
                                const unlocked = isStepUnlocked(step.stepId);
                                return (
                                  <button
                                    key={step.stepId}
                                    disabled={!unlocked}
                                    onClick={() => {
                                      if (!unlocked) return;
                                      toggleJourneyStepMutation.mutate({
                                        clientId: selectedClient.id,
                                        stepId: step.stepId,
                                        stepTitle: step.stepTitle
                                      });
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                      completed
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : unlocked
                                          ? 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                                          : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                    }`}
                                    data-testid={`toggle-journey-${step.stepId}`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      completed
                                        ? 'bg-green-500 border-green-500'
                                        : unlocked
                                          ? 'border-gray-300'
                                          : 'border-gray-200'
                                    }`}>
                                      {completed && <Check className="h-3 w-3 text-white" />}
                                      {!completed && !unlocked && <Lock className="h-2.5 w-2.5 text-gray-300" />}
                                    </div>
                                    <span className="text-sm font-medium">{step.icon} {step.stepTitle}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Quick Actions</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => {
                          setClientPopupOpen(false);
                          setMessageData({ 
                            clientId: selectedClient.id, 
                            clientName: selectedClient.name, 
                            subject: "", 
                            body: "" 
                          });
                          setSendMessageOpen(true);
                        }}
                        data-testid="button-popup-send-message"
                      >
                        <MessageSquare className="h-4 w-4" /> Send Message
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.location.href = `mailto:${selectedClient.email}`}
                        data-testid="button-popup-email"
                      >
                        <Mail className="h-4 w-4" /> Email Client
                      </Button>
                    </div>
                    <button 
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                      style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
                      onClick={() => {
                        setClientPopupOpen(false);
                        setOfferData({ 
                          clientId: selectedClient.id, 
                          clientName: selectedClient.name, 
                          offerType: "", 
                          message: "" 
                        });
                        setSendOfferOpen(true);
                      }}
                      data-testid="button-popup-send-offer"
                    >
                      <Sparkles className="h-4 w-4" /> Send Offer
                    </button>
                    {selectedClient.phone && (
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2"
                        onClick={() => window.location.href = `tel:${selectedClient.phone}`}
                        data-testid="button-popup-call"
                      >
                        <Phone className="h-4 w-4" /> Call Client
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Send Message to {messageData.clientName}</DialogTitle>
              <DialogDescription>
                Send a direct message to your client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="msg-subject">Subject</Label>
                <Input
                  id="msg-subject"
                  placeholder="Message subject..."
                  value={messageData.subject}
                  onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  data-testid="input-message-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="msg-body">Message</Label>
                <Textarea
                  id="msg-body"
                  placeholder="Write your message..."
                  value={messageData.body}
                  onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
                  rows={4}
                  required
                  data-testid="input-message-body"
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSendMessageOpen(false)}>
                  Cancel
                </Button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110" style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} data-testid="button-send-message-submit">
                  Send Message
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Floating Bulk Action Bar */}
        {selectedClientIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4" data-testid="bulk-action-bar">
            <span className="text-sm font-medium whitespace-nowrap">
              {selectedClientIds.size} client{selectedClientIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
              style={{ background: '#44ba84', border: '1px solid rgba(255,255,255,0.25)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }}
              onClick={() => {
                setBulkOfferData({ offerType: "", message: "" });
                setBulkOfferOpen(true);
              }}
              data-testid="button-bulk-send-offer"
            >
              <Sparkles className="h-4 w-4" /> Send Offer
            </button>
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
              onClick={() => setSelectedClientIds(new Set())}
              data-testid="button-clear-selection"
            >
              Clear
            </Button>
          </div>
        )}

        {/* Bulk Send Offer Dialog */}
        <Dialog open={bulkOfferOpen} onOpenChange={setBulkOfferOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">
                Send Offer to {selectedClientIds.size} Client{selectedClientIds.size > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                This offer will be sent to all selected clients
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBulkSendOffer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-offer-type">Offer Type</Label>
                <Select value={bulkOfferData.offerType} onValueChange={(v) => setBulkOfferData({ ...bulkOfferData, offerType: v })}>
                  <SelectTrigger data-testid="select-bulk-offer-type">
                    <SelectValue placeholder="Select offer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">Reward 🎁</SelectItem>
                    <SelectItem value="fixed_rate_ending">Fixed Rate Ending ⏰</SelectItem>
                    <SelectItem value="moving_house">Moving House 🏡</SelectItem>
                    <SelectItem value="home_insurance">Home Insurance 🏠</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance 🛡️</SelectItem>
                    <SelectItem value="wealth">Wealth Opportunity 💡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-offer-message">Optional Message</Label>
                <Textarea
                  id="bulk-offer-message"
                  placeholder="Add a personal note..."
                  value={bulkOfferData.message}
                  onChange={(e) => setBulkOfferData({ ...bulkOfferData, message: e.target.value })}
                  rows={3}
                  data-testid="input-bulk-offer-message"
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setBulkOfferOpen(false)}>
                  Cancel
                </Button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100" style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} disabled={!bulkOfferData.offerType || bulkSending} data-testid="button-bulk-send-offer-submit">
                  {bulkSending ? "Sending..." : `Send to ${selectedClientIds.size} Client${selectedClientIds.size > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Send Offer Dialog */}
        <Dialog open={sendOfferOpen} onOpenChange={setSendOfferOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Send Offer to {offerData.clientName}</DialogTitle>
              <DialogDescription>
                Send an offer or notification to your client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendOffer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offer-type">Offer Type</Label>
                <Select value={offerData.offerType} onValueChange={(v) => setOfferData({ ...offerData, offerType: v })}>
                  <SelectTrigger data-testid="select-offer-type">
                    <SelectValue placeholder="Select offer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward">Reward 🎁</SelectItem>
                    <SelectItem value="fixed_rate_ending">Fixed Rate Ending ⏰</SelectItem>
                    <SelectItem value="moving_house">Moving House 🏡</SelectItem>
                    <SelectItem value="home_insurance">Home Insurance 🏠</SelectItem>
                    <SelectItem value="life_insurance">Life Insurance 🛡️</SelectItem>
                    <SelectItem value="wealth">Wealth Opportunity 💡</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offer-message">Optional Message</Label>
                <Textarea
                  id="offer-message"
                  placeholder="Add a personal note..."
                  value={offerData.message}
                  onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                  rows={3}
                  data-testid="input-offer-message"
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSendOfferOpen(false)}>
                  Cancel
                </Button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100" style={{ background: '#44ba84', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} disabled={!offerData.offerType} data-testid="button-send-offer-submit">
                  Send Offer
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
