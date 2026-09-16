import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-lg mb-2 shadow-sm">
          DSS
        </div>
        <h1 className="text-xl font-bold text-slate-900">DSS Logistics Employee Portal</h1>
        <p className="text-xs text-slate-500 mt-1">Sign in with your corporate Clerk credentials to access Ask Policy</p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto shadow-md rounded-2xl",
            card: "rounded-2xl border border-slate-200 shadow-none",
            primaryButton: "bg-emerald-600 hover:bg-emerald-700 text-sm font-medium",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </div>
  );
}
