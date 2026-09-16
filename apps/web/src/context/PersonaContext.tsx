"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Persona {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  permissions: string[];
  isHrOps: boolean;
}

export const PERSONAS: Persona[] = [
  {
    id: "user_arjun",
    name: "Arjun Reddy",
    email: "arjun.reddy@dsslogistics.example",
    role: "Senior Logistics Coordinator",
    location: "India (Hyderabad HQ)",
    permissions: ["org:audience:all-employees", "org:audience:india-employees"],
    isHrOps: false,
  },
  {
    id: "user_emily",
    name: "Emily Chen",
    email: "emily.chen@dsslogistics.example",
    role: "Freight Operations Analyst",
    location: "US (Chicago Center)",
    permissions: ["org:audience:all-employees", "org:audience:us-employees"],
    isHrOps: false,
  },
  {
    id: "user_rahul",
    name: "Rahul Mehta",
    email: "rahul.mehta@dsslogistics.example",
    role: "HR Operations Lead",
    location: "India (Hyderabad HQ)",
    permissions: [
      "org:audience:all-employees",
      "org:audience:india-employees",
      "org:audience:hr-managers",
      "org:role:hr-ops",
    ],
    isHrOps: true,
  },
  {
    id: "user_kavya",
    name: "Kavya Iyer",
    email: "kavya.iyer@dsslogistics.example",
    role: "Warehouse Operations Manager",
    location: "India (Bangalore Facility)",
    permissions: [
      "org:audience:all-employees",
      "org:audience:india-employees",
      "org:audience:people-managers",
    ],
    isHrOps: false,
  },
];

interface PersonaContextType {
  currentPersona: Persona;
  setPersona: (persona: Persona) => void;
  getHeaders: () => Record<string, string>;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);

  useEffect(() => {
    const saved = localStorage.getItem("dss_persona_id");
    if (saved) {
      const found = PERSONAS.find((p) => p.id === saved);
      if (found) setCurrentPersona(found);
    }
  }, []);

  const setPersona = (persona: Persona) => {
    setCurrentPersona(persona);
    localStorage.setItem("dss_persona_id", persona.id);
  };

  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      "x-clerk-user-id": currentPersona.id,
      "x-clerk-permissions": currentPersona.permissions.join(","),
      "x-clerk-org-id": "org_3JOvLRFnE0PQixivSXSmJC5Gcdt",
    };
  };

  return (
    <PersonaContext.Provider value={{ currentPersona, setPersona, getHeaders }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
};
