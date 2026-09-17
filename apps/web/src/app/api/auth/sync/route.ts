import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getBackendUrl } from "../../../../lib/backend";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_ORG_ID = process.env.CLERK_ORG_ID || "org_3JOvLRFnE0PQixivSXSmJC5Gcdt";

export async function GET(req: NextRequest) {
  const BACKEND_URL = getBackendUrl();
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
    const fullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || email.split("@")[0];

    // 1. Ensure user is enrolled in the single company organization (DSS Logistics)
    if (CLERK_SECRET_KEY && CLERK_ORG_ID) {
      try {
        const checkRes = await fetch(
          `https://api.clerk.com/v1/users/${userId}/organization_memberships`,
          {
            headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
          }
        );
        if (checkRes.ok) {
          const memberships = await checkRes.json();
          const isInOrg = memberships.data?.some(
            (m: any) => m.organization?.id === CLERK_ORG_ID
          );
          if (!isInOrg) {
            const role = email === "aiteam@deccansoft.net" ? "org:admin" : "org:member";
            await fetch(
              `https://api.clerk.com/v1/organizations/${CLERK_ORG_ID}/memberships`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${CLERK_SECRET_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id: userId, role }),
              }
            );
          }
        }
      } catch (err) {
        console.error("Clerk org auto-enrollment notice:", err);
      }
    }

    // 2. Query backend for user's DB profile & permissions.
    // One retry absorbs Render free-tier cold starts (the first request after
    // idle can take 30-50s; a single quick retry catches fast-warming cases and
    // keeps us from fabricating a status on a transient blip).
    const token = await getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-clerk-user-id": userId,
      "x-clerk-user-email": email,
      "x-clerk-user-name": fullName,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchProfile = () =>
      fetch(`${BACKEND_URL}/ops/me`, { headers, signal: AbortSignal.timeout(25000) });

    let res: Response | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetchProfile();
        if (r.ok || r.status === 401 || r.status === 403) {
          res = r;
          break;
        }
        // 5xx / network-ish failure: brief backoff, then retry once.
        lastErr = new Error(`backend status ${r.status}`);
      } catch (e) {
        lastErr = e;
      }
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json({
        authenticated: true,
        user: {
          id: userId,
          email,
          fullName,
          imageUrl: user?.imageUrl || "",
          role: data.role,
          status: data.status,
          isHrOps: data.is_hr_ops,
          allowedGroups: data.allowed_groups,
        },
      });
    }

    // Backend unreachable or errored. Report an honest DEGRADED state — never
    // fabricate "pending_approval", which the UI would render as an
    // authorization decision. The client shows a connection warning instead.
    return NextResponse.json({
      authenticated: true,
      degraded: true,
      detail: lastErr instanceof Error ? lastErr.message : "backend_unreachable",
      user: {
        id: userId,
        email,
        fullName,
        imageUrl: user?.imageUrl || "",
        role: null,
        status: "unknown",
        isHrOps: false,
        allowedGroups: [],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Sync error", detail: err.message },
      { status: 500 }
    );
  }
}
