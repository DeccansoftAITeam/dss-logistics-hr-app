import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";

async function proxyRequest(req: NextRequest, method: "GET" | "POST", slug: string[]) {
  try {
    const { userId, getToken } = await auth();
    const token = await getToken();
    const user = await currentUser();
    const subpath = slug.join("/");
    const search = req.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/ops/${subpath}${search}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const personaUser = req.headers.get("x-clerk-user-id") || userId;
    const personaEmail = req.headers.get("x-clerk-user-email") || user?.primaryEmailAddress?.emailAddress;
    const personaName = req.headers.get("x-clerk-user-name") || user?.fullName;
    const personaPerms = req.headers.get("x-clerk-permissions");
    const personaOrg = req.headers.get("x-clerk-org-id");

    if (personaUser) headers["x-clerk-user-id"] = personaUser;
    if (personaEmail) headers["x-clerk-user-email"] = personaEmail;
    if (personaName) headers["x-clerk-user-name"] = personaName;
    if (personaPerms) headers["x-clerk-permissions"] = personaPerms;
    if (personaOrg) headers["x-clerk-org-id"] = personaOrg;

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST") {
      const bodyText = await req.text();
      if (bodyText) {
        fetchOptions.body = bodyText;
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { text: await res.text() };
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Backend proxy error", detail: err.message },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return proxyRequest(req, "GET", params.slug);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return proxyRequest(req, "POST", params.slug);
}
