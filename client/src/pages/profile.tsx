import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Calendar, Shield, Pencil, Check, X, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editCalendarUrl, setEditCalendarUrl] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; dateOfBirth?: string; calendarUrl?: string | null }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your details have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const startEditing = () => {
    if (user) {
      setEditName(user.name);
      setEditDob(user.dateOfBirth || "");
      setEditCalendarUrl((user as any).calendarUrl || "");
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = () => {
    if (!editName.trim()) {
      toast({ title: "Error", description: "Name cannot be empty.", variant: "destructive" });
      return;
    }
    const trimmedUrl = editCalendarUrl.trim();
    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      toast({ title: "Invalid link", description: "Calendar link must start with https://", variant: "destructive" });
      return;
    }
    const payload: { name: string; dateOfBirth: string; calendarUrl?: string | null } = {
      name: editName.trim(),
      dateOfBirth: editDob,
    };
    if (user?.role === "broker") {
      payload.calendarUrl = trimmedUrl || null;
    }
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      client: "bg-green-50 text-green-700 border-green-200",
      broker: "bg-blue-50 text-blue-700 border-blue-200",
      admin: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return styles[role] || styles.client;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900" data-testid="text-profile-heading">
              {user.name}
            </h1>
            <span
              className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border mt-1 ${getRoleBadgeStyle(user.role)}`}
              data-testid="text-profile-role"
            >
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Personal Information</h2>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                className="text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
                data-testid="button-edit-profile"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  className="text-gray-500 hover:text-gray-700 gap-1.5"
                  data-testid="button-cancel-edit"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={updateMutation.isPending}
                  className="bg-primary hover:bg-primary/90 gap-1.5"
                  data-testid="button-save-profile"
                >
                  <Check className="h-3.5 w-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-9 text-sm"
                    data-testid="input-edit-name"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-profile-name">
                    {user.name}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Email Address</p>
                <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-profile-email">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                <Calendar className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="h-9 text-sm"
                    data-testid="input-edit-dob"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900" data-testid="text-profile-dob">
                    {user.dateOfBirth ? formatDate(user.dateOfBirth) : "Not set"}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 flex items-center gap-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Account Type</p>
                <p className="text-sm font-medium text-gray-900" data-testid="text-profile-account-type">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            </div>

            {user.role === "broker" && (
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Calendar Booking Link</p>
                  {isEditing ? (
                    <>
                      <Input
                        type="url"
                        placeholder="https://calendly.com/your-link"
                        value={editCalendarUrl}
                        onChange={(e) => setEditCalendarUrl(e.target.value)}
                        className="h-9 text-sm"
                        data-testid="input-edit-calendar-url"
                      />
                      <p className="text-xs text-gray-400 mt-1">Clients use this link to book consultations with you (Calendly, Google Calendar, etc.).</p>
                    </>
                  ) : (
                    (user as any).calendarUrl ? (
                      <a
                        href={(user as any).calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary truncate block hover:underline"
                        data-testid="text-profile-calendar-url"
                      >
                        {(user as any).calendarUrl}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-400" data-testid="text-profile-calendar-url-empty">
                        Not set — add a link so clients can book meetings
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            {user.createdAt && (
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 shrink-0">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-profile-member-since">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
