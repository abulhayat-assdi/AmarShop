/**
 * Notification abstraction (spec §13 — provider undecided). Order confirmations
 * and subscription reminders go through this interface, so plugging a real
 * email/SMS provider later is a one-file change. Until then a console adapter
 * logs the messages.
 */
export type Notification = {
  channel: "email" | "sms";
  to: string;
  subject?: string;
  body: string;
};

export interface Notifier {
  send(notification: Notification): Promise<void>;
}

const consoleNotifier: Notifier = {
  async send(notification) {
    console.log(
      `[notify:${notification.channel}] to=${notification.to}` +
        (notification.subject ? ` subject=${notification.subject}` : "") +
        ` :: ${notification.body}`,
    );
  },
};

/** Returns the active notifier. Swap in an email/SMS provider adapter here. */
export function getNotifier(): Notifier {
  return consoleNotifier;
}

/** Best-effort send that never throws — notifications must not break a flow. */
export async function notifySafe(notification: Notification): Promise<void> {
  try {
    await getNotifier().send(notification);
  } catch (error) {
    console.error("Notification failed:", error);
  }
}
