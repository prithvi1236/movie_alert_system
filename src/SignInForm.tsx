"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "./hooks/use-toast";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((_error) => {
            let toastTitle: string;
            toastTitle =
              flow === "signIn"
                ? "Could not sign in, did you mean to sign up?"
                : "Could not sign up, did you mean to sign in?";
            toast({ title: toastTitle, variant: "destructive" });
            setSubmitting(false);
          });
        }}
      >
        <div className="relative">
          <input 
            className="input-field peer pt-6 pb-2" 
            type="email" 
            name="email" 
            placeholder=" " 
            required 
          />
          <label className="absolute left-3 top-4 text-gray-500 transition-all peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
            Email
          </label>
        </div>
        <div className="relative">
          <input 
            className="input-field peer pt-6 pb-2" 
            type="password" 
            name="password" 
            placeholder=" " 
            required 
          />
          <label className="absolute left-3 top-4 text-gray-500 transition-all peer-placeholder-shown:top-4 peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
            Password
          </label>
        </div>
        <button 
          className="auth-button relative overflow-hidden group" 
          type="submit" 
          disabled={submitting}
        >
          <span className={`inline-flex items-center transition-transform duration-300 ${submitting ? 'translate-y-full' : 'translate-y-0'}`}>
            {flow === "signIn" ? "Sign in" : "Sign up"}
          </span>
          {submitting && (
            <span className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
        </button>
        <div className="text-center text-sm text-slate-600">
          <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
          <button
            type="button"
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-4">
        <hr className="grow border-gray-200" />
        <span className="mx-4 text-sm text-gray-400">or</span>
        <hr className="grow border-gray-200" />
      </div>
      <button 
        className="auth-button bg-gray-800 hover:bg-gray-700 transition-colors" 
        onClick={() => signIn("anonymous")}
      >
        Continue as guest
      </button>
    </div>
  );
}
