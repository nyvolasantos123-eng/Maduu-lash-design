import { getDeployStore, getStore } from "@netlify/blobs";

function isProduction() {
  return Netlify.context?.deploy?.context === "production";
}

export function scheduleStore() {
  return isProduction()
    ? getStore("madu-lash-schedule", { consistency: "strong" })
    : getDeployStore("madu-lash-schedule");
}

export function sessionStore() {
  return isProduction()
    ? getStore("madu-lash-admin-sessions", { consistency: "strong" })
    : getDeployStore("madu-lash-admin-sessions");
}

export async function readCalendar() {
  const store = scheduleStore();
  const data = await store.get("calendar-v2", { type: "json" });
  if (!data || typeof data !== "object" || !data.days || typeof data.days !== "object") {
    return { days: {} };
  }
  return data;
}

export async function writeCalendar(calendar: { days: Record<string, unknown> }) {
  await scheduleStore().setJSON("calendar-v2", calendar);
}

export async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const store = sessionStore();
  const session = await store.get(`session:${token}`, { type: "json" });
  if (!session || typeof session !== "object" || Number(session.expiresAt) <= Date.now()) {
    if (session) await store.delete(`session:${token}`);
    return null;
  }
  return { token, session };
}
