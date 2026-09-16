import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] py-8">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-lg mb-2 shadow-sm">
          DSS
        </div>
        <h1 className="text-xl font-bold text-slate-900">Create your DSS Account</h1>
        <p className="text-xs text-slate-500 mt-1">Register for DSS Ask Policy and HR Ops access</p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto shadow-md rounded-2xl",
            card: "rounded-2xl border border-slate-200 shadow-none",
            primaryButton: "bg-emerald-600 hover:bg-emerald-700 text-sm font-medium",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
      />
    </div>
  );
}
