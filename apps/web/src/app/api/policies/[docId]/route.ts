import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getBackendUrl } from "../../../../lib/backend";

export async function GET(
  req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const BACKEND_URL = getBackendUrl();
  try {
    const { userId, getToken } = await auth();
    const token = await getToken();
    const user = await currentUser();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const personaUser = req.headers.get("x-clerk-user-id") || userId;
    const personaEmail = req.headers.get("x-clerk-user-email") || user?.primaryEmailAddress?.emailAddress;
    const personaName = req.headers.get("x-clerk-user-name") || user?.fullName;

    if (personaUser) headers["x-clerk-user-id"] = personaUser;
    if (personaEmail) headers["x-clerk-user-email"] = personaEmail;
    if (personaName) headers["x-clerk-user-name"] = personaName;

    const res = await fetch(`${BACKEND_URL}/policies/${params.docId}`, { headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Backend proxy error", detail: err.message },
      { status: 502 }
    );
  }
}
