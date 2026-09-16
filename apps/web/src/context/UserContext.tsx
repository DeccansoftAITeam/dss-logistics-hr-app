"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser, useOrganization, useOrganizationList } from "@clerk/nextjs";

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  imageUrl: string;
  role: "Admin" | "HR" | "User";
  status: "verified" | "pending_approval" | "rejected";
  isHrOps: boolean;
  allowedGroups: string[];
}

interface UserContextType {
  profile: UserProfileData | null;
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
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/sync");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setProfile(data.user);
        }
      }
    } catch (e) {
      console.error("Failed to sync profile:", e);
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
