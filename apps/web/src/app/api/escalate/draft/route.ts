import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const personaUser = req.headers.get("x-clerk-user-id");
    const personaPerms = req.headers.get("x-clerk-permissions");
    const personaOrg = req.headers.get("x-clerk-org-id");

    if (personaUser) headers["x-clerk-user-id"] = personaUser;
    if (personaPerms) headers["x-clerk-permissions"] = personaPerms;
    if (personaOrg) headers["x-clerk-org-id"] = personaOrg;

    const res = await fetch(`${BACKEND_URL}/escalate/draft`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Backend proxy error", detail: err.message },
      { status: 502 }
    );
  }
}
