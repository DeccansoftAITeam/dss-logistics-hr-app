"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser, useOrganization, useOrganizationList } from "@clerk/nextjs";

export type ProfileStatus = "verified" | "pending_approval" | "rejected" | "unknown";

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  imageUrl: string;
  role: "Admin" | "HR" | "User" | null;
  status: ProfileStatus;
  isHrOps: boolean;
  allowedGroups: string[];
}

interface UserContextType {
  profile: UserProfileData | null;
  /** True when the backend could not be reached and `profile` is last-known-good. */
  degraded: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const { setActive, userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(true);
  // Last-known-good profile from a successful sync. On a degraded backend call we
  // keep showing this instead of downgrading the user to a fabricated state.
  const lastGoodProfile = useRef<UserProfileData | null>(null);

  // Automatically activate DSS Logistics organization if none active
  useEffect(() => {
    if (isSignedIn && orgListLoaded && setActive && !organization) {
      const dssOrg = userMemberships.data?.find(
        (m) => m.organization.id === "org_3JOvLRFnE0PQixivSXSmJC5Gcdt"
      );
      if (dssOrg) {
        setActive({ organization: dssOrg.organization.id });
      } else if (userMemberships.data && userMemberships.data.length > 0) {
        setActive({ organization: userMemberships.data[0].organization.id });
      }
    }
  }, [isSignedIn, orgListLoaded, organization, userMemberships.data, setActive]);

  const fetchProfile = useCallback(async () => {
    if (!isSignedIn) {
      setProfile(null);
      lastGoodProfile.current = null;
      setDegraded(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/sync");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          const next = data.user as UserProfileData;
          // Backend unreachable -> keep last-known-good and surface a degraded
          // banner. Never fabricate a status; never downgrade a verified user.
          const backendUnreachable = data.degraded === true || next.status === "unknown";
          if (backendUnreachable) {
            setDegraded(true);
            setProfile(lastGoodProfile.current ?? next);
          } else {
            setDegraded(false);
            setProfile(next);
            lastGoodProfile.current = next;
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync profile:", e);
      setDegraded(true);
      if (lastGoodProfile.current) setProfile(lastGoodProfile.current);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (clerkLoaded) {
      fetchProfile();
    }
  }, [clerkLoaded, isSignedIn, fetchProfile]);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (clerkUser) {
      headers["x-clerk-user-id"] = clerkUser.id;
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (email) headers["x-clerk-user-email"] = email;
      if (clerkUser.fullName) headers["x-clerk-user-name"] = clerkUser.fullName;
    }
    return headers;
  }, [clerkUser]);

  return (
    <UserContext.Provider
      value={{
        profile,
        degraded,
        loading: loading || !clerkLoaded,
        refreshProfile: fetchProfile,
        getAuthHeaders,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useAuthUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useAuthUser must be used within a UserProvider");
  }
  return ctx;
};