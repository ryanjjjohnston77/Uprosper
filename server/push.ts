import webpush from "web-push";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@uprosper.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[Push] VAPID keys not configured, skipping push notification");
    return;
  }

  try {
    const subscriptions = await db
      .select()
      .from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-72.png",
      data: {
        url: payload.url || "/",
      },
      tag: payload.tag,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .delete(schema.pushSubscriptions)
            .where(eq(schema.pushSubscriptions.id, sub.id));
          console.log(`[Push] Removed expired subscription ${sub.id}`);
        } else {
          console.error(`[Push] Error sending to subscription ${sub.id}:`, error.message);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error("[Push] Error sending push notification:", error);
  }
}

export async function sendPushToClientByClientId(clientId: number, payload: PushPayload): Promise<void> {
  try {
    const client = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId));

    if (!client[0]) return;

    const user = await db
      .select()
      .from(schema.users)
      .where(sql`LOWER(${schema.users.email}) = LOWER(${client[0].email})`);

    if (!user[0]) return;

    await sendPushToUser(user[0].id, payload);
  } catch (error) {
    console.error("[Push] Error finding user for client:", error);
  }
}
