import { readCalendar } from "../lib/stores.mts";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }
  const calendar = await readCalendar();
  return Response.json(calendar, { headers: { "Cache-Control": "no-store, max-age=0" } });
};

export const config = { path: "/api/schedule" };
