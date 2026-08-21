import { storage } from "./storage.js";
import { sendPushToClientByClientId, sendPushToUser } from "./push.js";

function parseMeetingDateTime(meetingDateStr: string, meetingTimeStr: string): Date | null {
  const timeParts = meetingTimeStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeParts) return null;

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);

  if (meetingTimeStr.toLowerCase().includes("pm") && hours !== 12) hours += 12;
  if (meetingTimeStr.toLowerCase().includes("am") && hours === 12) hours = 0;

  const meetingDate = new Date(meetingDateStr);
  if (isNaN(meetingDate.getTime())) return null;

  meetingDate.setHours(hours, minutes, 0, 0);
  return meetingDate;
}

async function checkAndSendReminders() {
  try {
    const appointments = await storage.getUpcomingAppointmentsForReminder();
    const now = new Date();

    for (const appt of appointments) {
      if (!appt.meetingDate) continue;

      const meetingDate = parseMeetingDateTime(appt.meetingDate, appt.meetingTime || "09:00");
      if (!meetingDate) continue;

      if (meetingDate.getTime() < now.getTime()) {
        await storage.markEnquiryReminderSent(appt.id);
        continue;
      }

      const diffMs = meetingDate.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes > 0 && diffMinutes <= 60) {
        const timeStr = meetingDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const dateStr = meetingDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

        const client = await storage.getClient(appt.clientId);
        const clientName = client?.name || "your client";

        const meetingLinkSuffix = appt.meetingLink ? `\n[MEETING_LINK:${appt.meetingLink}]` : '';
        await storage.createNotification({
          clientId: appt.clientId,
          type: "appointment_reminder",
          title: "Appointment Reminder ⏰",
          message: `Your appointment is at ${timeStr} on ${dateStr}. Please be ready for your meeting.${meetingLinkSuffix}`,
          read: false,
        });

        await storage.createBrokerNotification({
          brokerUserId: appt.brokerUserId,
          type: "appointment_reminder",
          title: "Appointment Reminder ⏰",
          message: `Meeting with ${clientName} at ${timeStr} on ${dateStr}`,
          read: false,
          enquiryId: appt.id,
        });

        sendPushToClientByClientId(appt.clientId, {
          title: `⏰ Meeting at ${timeStr} on ${dateStr}`,
          body: "",
          url: "/client",
          tag: "reminder-" + appt.id,
        }).catch(() => {});

        sendPushToUser(appt.brokerUserId, {
          title: `⏰ Meeting with ${clientName} at ${timeStr} on ${dateStr}`,
          body: "",
          url: "/broker",
          tag: "reminder-broker-" + appt.id,
        }).catch(() => {});

        await storage.markEnquiryReminderSent(appt.id);
        console.log(`[Reminder] Sent 1-hour reminders for appointment #${appt.id} with ${clientName} at ${timeStr} on ${dateStr}`);
      }
    }
  } catch (error) {
    console.error("[Reminder] Error checking 1-hour reminders:", error);
  }
}

async function checkAndSend2MinReminders() {
  try {
    const appointments = await storage.getUpcomingAppointmentsFor2MinReminder();
    const now = new Date();

    for (const appt of appointments) {
      if (!appt.meetingDate) continue;

      const meetingDate = parseMeetingDateTime(appt.meetingDate, appt.meetingTime || "09:00");
      if (!meetingDate) continue;

      if (meetingDate.getTime() < now.getTime()) {
        await storage.markEnquiryReminder2MinSent(appt.id);
        continue;
      }

      const diffMs = meetingDate.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes > 0 && diffMinutes <= 2) {
        const timeStr = meetingDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

        const client = await storage.getClient(appt.clientId);
        const clientName = client?.name || "your client";

        sendPushToClientByClientId(appt.clientId, {
          title: `🔔 Your meeting starts in 2 minutes at ${timeStr}!`,
          body: "",
          url: "/client",
          tag: "reminder-2min-" + appt.id,
        }).catch(() => {});

        sendPushToUser(appt.brokerUserId, {
          title: `🔔 Meeting with ${clientName} starts in 2 minutes at ${timeStr}!`,
          body: "",
          url: "/broker",
          tag: "reminder-2min-broker-" + appt.id,
        }).catch(() => {});

        await storage.markEnquiryReminder2MinSent(appt.id);
        console.log(`[Reminder] Sent 2-min reminders for appointment #${appt.id} with ${clientName} at ${timeStr}`);
      }
    }
  } catch (error) {
    console.error("[Reminder] Error checking 2-min reminders:", error);
  }
}

function lastDayOfMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatGBP(amount: number): string {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `£${Math.round(amount)}`;
  }
}

function nextPaymentDate(dayOfMonth: number, now: Date): Date {
  // Try this month
  const y1 = now.getFullYear();
  const m1 = now.getMonth();
  const clamped1 = Math.min(dayOfMonth, lastDayOfMonth(y1, m1));
  const candidate = new Date(y1, m1, clamped1, 0, 0, 0, 0);
  if (candidate.getTime() > now.getTime()) return candidate;
  // Roll forward to next month
  const y2 = m1 === 11 ? y1 + 1 : y1;
  const m2 = (m1 + 1) % 12;
  const clamped2 = Math.min(dayOfMonth, lastDayOfMonth(y2, m2));
  return new Date(y2, m2, clamped2, 0, 0, 0, 0);
}

async function checkAndSendPaymentReminders() {
  try {
    const reminders = await storage.getDuePaymentReminders();
    const now = new Date();

    for (const reminder of reminders) {
      // getDuePaymentReminders() already enforces the 23h..25h window
      // AND the lastSentForDate dedupe. We just need to recompute `next`
      // here to derive the per-payment dedupe key for marking + push tag.
      const next = nextPaymentDate(reminder.dayOfMonth, now);
      const nextDateKey = ymd(next);

      const client = await storage.getClient(reminder.clientId);
      if (!client) continue;

      const monthly = parseFloat(client.monthlyPayment || "0");
      const amountStr = monthly > 0 ? formatGBP(monthly) : "your mortgage payment";
      const dateStr = next.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
      const defaultMsg = monthly > 0
        ? `Your mortgage payment of ${amountStr} comes out tomorrow (${dateStr}). Make sure your account is topped up.`
        : `Your mortgage payment comes out tomorrow (${dateStr}). Make sure your account is topped up.`;
      const message = (reminder.customMessage && reminder.customMessage.trim().length > 0)
        ? reminder.customMessage.trim()
        : defaultMsg;

      await storage.createNotification({
        clientId: reminder.clientId,
        type: "payment_reminder",
        title: "Payment reminder 💳",
        message,
        read: false,
      });

      sendPushToClientByClientId(reminder.clientId, {
        title: "💳 Mortgage payment tomorrow",
        body: message,
        url: "/client",
        tag: `payment-reminder-${reminder.clientId}-${nextDateKey}`,
      }).catch(() => {});

      await storage.markPaymentReminderSent(reminder.id, nextDateKey);
      console.log(`[Reminder] Sent payment reminder for client #${reminder.clientId} (due ${nextDateKey})`);
    }
  } catch (error) {
    console.error("[Reminder] Error checking payment reminders:", error);
  }
}

async function checkAndSendClientAppointmentReminders() {
  try {
    const due = await storage.getDueClientAppointmentReminders();

    for (const appt of due) {
      const timeStr = appt.meetingTime;
      const dateParts = appt.meetingDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      let dateStr = appt.meetingDate;
      if (dateParts) {
        const dateObj = new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]));
        if (!isNaN(dateObj.getTime())) {
          dateStr = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        }
      }

      const message = `Reminder: your meeting with your broker is tomorrow at ${timeStr} on ${dateStr}.`;

      await storage.createNotification({
        clientId: appt.clientId,
        type: "appointment_reminder",
        title: "Meeting tomorrow ⏰",
        message,
        read: false,
      });

      sendPushToClientByClientId(appt.clientId, {
        title: `⏰ Meeting tomorrow at ${timeStr}`,
        body: message,
        url: "/client",
        tag: `client-appt-reminder-${appt.id}`,
      }).catch(() => {});

      await storage.markClientAppointmentReminderSent(appt.id);
      console.log(`[Reminder] Sent 24h client-self-booked reminder for appointment #${appt.id}`);
    }
  } catch (error) {
    console.error("[Reminder] Error checking client appointment reminders:", error);
  }
}

export function startReminderScheduler() {
  console.log("[Reminder] Appointment reminder scheduler started (1-hour every 60s, 2-min every 30s, payments every 5min, client appts every 5min)");
  checkAndSendReminders();
  checkAndSend2MinReminders();
  checkAndSendPaymentReminders();
  checkAndSendClientAppointmentReminders();
  setInterval(checkAndSendReminders, 60 * 1000);
  setInterval(checkAndSend2MinReminders, 30 * 1000);
  setInterval(checkAndSendPaymentReminders, 5 * 60 * 1000);
  setInterval(checkAndSendClientAppointmentReminders, 5 * 60 * 1000);
}
