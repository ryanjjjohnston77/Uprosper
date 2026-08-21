import { useState } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Eye, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface Client {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  clientId: number;
  brokerUserId: string;
  subject: string;
  content: string;
  read: boolean;
  senderType: string;
  createdAt: string;
}

export default function BrokerMessages() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['broker-clients'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/my-clients');
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['broker-messages'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/broker/messages');
      return res.json();
    },
    enabled: !!user && user.role === 'broker',
    refetchInterval: 3000,
  });

  const clientMessages = messages.filter(m => m.senderType === 'client');
  const unreadMessagesCount = clientMessages.filter(m => !m.read).length;

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-messages'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ clientId, content }: { clientId: number; content: string }) => {
      const res = await apiRequest('POST', '/api/broker/messages', {
        clientId,
        subject: "Re: " + (selectedMessage?.subject || "Your message"),
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-messages'] });
      toast.success("Reply sent successfully!");
      setReplyText("");
      setSelectedMessage(null);
    },
    onError: () => {
      toast.error("Failed to send reply. Please try again.");
    },
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    replyMutation.mutate({
      clientId: selectedMessage.clientId,
      content: replyText.trim(),
    });
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Please log in as a broker to view messages.</p>
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
            <h1 className="text-2xl font-heading font-bold text-gray-900">Client Messages</h1>
            <p className="text-muted-foreground">View and respond to all client messages</p>
          </div>
          {unreadMessagesCount > 0 && (
            <Badge variant="destructive" className="rounded-full px-2.5 ml-auto">
              {unreadMessagesCount} unread
            </Badge>
          )}
        </div>

        <Card className="bg-white shadow-md border-none">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-heading font-bold text-gray-900">
                All Messages ({clientMessages.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clientMessages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No messages from clients yet</p>
                <p className="text-sm">When clients reach out, their messages will appear here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {clientMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!message.read ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleViewMessage(message)}
                    data-testid={`message-row-${message.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!message.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                          <span className="font-medium text-gray-900 truncate" data-testid={`message-client-${message.id}`}>
                            {getClientName(message.clientId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="font-medium text-sm mt-1">{message.subject}</p>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{message.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleViewMessage(message); }}
                        data-testid={`button-view-message-${message.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedMessage} onOpenChange={(open) => { if (!open) { setSelectedMessage(null); setReplyText(""); } }}>
          <DialogContent className="sm:max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading font-bold text-gray-900">
                {selectedMessage?.subject || "Message"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                From {selectedMessage ? getClientName(selectedMessage.clientId) : ''} • {selectedMessage?.createdAt && formatDistance(new Date(selectedMessage.createdAt), new Date(), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>
            <div className="mt-4 space-y-3">
              <Label htmlFor="replyMessage" className="text-sm font-medium text-gray-700">Reply</Label>
              <Textarea
                id="replyMessage"
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-gray-50 border-gray-200 min-h-[100px]"
                data-testid="textarea-reply"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setSelectedMessage(null); setReplyText(""); }}
                  data-testid="button-cancel-reply"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  disabled={!replyText.trim() || replyMutation.isPending}
                  onClick={handleSendReply}
                  data-testid="button-send-reply"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
