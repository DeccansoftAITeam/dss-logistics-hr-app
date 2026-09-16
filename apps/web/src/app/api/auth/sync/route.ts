import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_ORG_ID = process.env.CLERK_ORG_ID || "org_3JOvLRFnE0PQixivSXSmJC5Gcdt";
const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
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

    // 2. Query backend for user's DB profile & permissions
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

    const res = await fetch(`${BACKEND_URL}/ops/me`, { headers });
    if (res.ok) {
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

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userId,
        email,
        fullName,
        imageUrl: user?.imageUrl || "",
        role: "User",
        status: "pending_approval",
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
