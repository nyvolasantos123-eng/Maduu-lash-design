import { sessionStore } from "../lib/stores.mts";

function makeToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }

  const body = await req.json().catch(() => ({}));
  const username = String(body?.username || "");
  const password = String(body?.password || "");
  const expectedUser = Netlify.env.get("MADU_ADMIN_USER");
  const expectedPassword = Netlify.env.get("MADU_ADMIN_PASSWORD");

  if (!expectedUser || !expectedPassword) {
    return Response.json({ error: "Admin ainda não configurado no servidor." }, { status: 503 });
  }

  if (username !== expectedUser || password !== expectedPassword) {
    return Response.json({ error: "Login ou senha incorretos." }, { status: 401 });
  }

  const token = makeToken();
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  await sessionStore().setJSON(`session:${token}`, { username: expectedUser, expiresAt });
  return Response.json({ token, expiresAt });
};

export const config = { path: "/api/admin/login" };
