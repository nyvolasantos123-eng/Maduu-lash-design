import { readCalendar, requireAdmin, writeCalendar } from "../lib/stores.mts";

function validDateKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y,m,d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const today = new Date(); today.setHours(12,0,0,0);
  const max = new Date(today.getFullYear() + 1, 11, 31, 12);
  return date >= today && date <= max;
}

function normalizeSlots(slots: unknown) {
  if (!Array.isArray(slots)) return [];
  const map = new Map<string, "available" | "occupied">();
  for (const raw of slots) {
    const time = String((raw as any)?.time || "");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
    const status = (raw as any)?.status === "occupied" ? "occupied" : "available";
    map.set(time, status);
  }
  return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0])).map(([time,status]) => ({ time, status }));
}

export default async (req: Request) => {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Sessão inválida ou expirada." }, { status: 401 });

  const calendar = await readCalendar();
  const days = calendar.days as Record<string, any>;

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";
    if (!validDateKey(date)) return Response.json({ error: "Data inválida." }, { status: 400 });
    delete days[date];
    await writeCalendar({ days });
    return Response.json({ ok: true, date, unpublished: true });
  }

  if (req.method === "PUT") {
    const body = await req.json().catch(() => ({}));
    const date = String(body?.date || "");
    const status = body?.status === "full" ? "full" : body?.status === "open" ? "open" : "";
    if (!validDateKey(date)) return Response.json({ error: "Data inválida." }, { status: 400 });
    if (!status) return Response.json({ error: "Status inválido." }, { status: 400 });
    const slots = normalizeSlots(body?.slots);
    if (status === "open" && slots.length === 0) {
      return Response.json({ error: "Adicione pelo menos um horário antes de publicar o dia." }, { status: 400 });
    }
    days[date] = { status, slots, updatedAt: new Date().toISOString() };
    await writeCalendar({ days });
    return Response.json({ ok: true, date, day: days[date] });
  }

  return Response.json({ error: "Método não permitido." }, { status: 405 });
};

export const config = { path: "/api/admin/day" };
