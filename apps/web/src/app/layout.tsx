import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { UserProvider } from "../context/UserContext";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "DSS Logistics · Enterprise Policy & Intranet Portal",
  description: "Enterprise Policy Intranet and Operations Console for DSS Logistics Pvt Ltd",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
          <UserProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
