import { useState } from "react";
import { User as UserType, Quote as QuoteType } from "@/types";
import { useSearchParams } from 'react-router-dom';

interface LoginProps {
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

export function Login({ user, setUser }: LoginProps) {
  const [mode, setMode] = useState("login");
  const [searchParams] = useSearchParams();
  const expiredSession = searchParams.get('expired');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      <BrandPanel />
      {mode === 'login' ? <LoginForm setMode={setMode} expiredSession={expiredSession} /> : <RegisterForm setMode={setMode} /> }      
    </div>
  );
}

function BrandPanel() {
  const quotes: QuoteType[]  = [                                                                                                                  
    {
      quote: "Compliance isn't paperwork. It's the foundation of organizational trust.",                                             
      initials: "JA",                                            
      name: "Jane Admin",
      title: "Head of Compliance",
    },
    {
      quote: "A policy only protects you if everyone knows they've read it.",
      initials: "MR",
      name: "Marcus Reid",
      title: "VP of Human Resources",
    },
    {
      quote: "Accountability starts with acknowledgment. Sign-off is where intent becomes record.",
      initials: "SP",
      name: "Sandra Park",
      title: "Chief People Officer",
    },
    {
      quote: "The best compliance programs aren't about catching mistakes. They're about preventing them.",
      initials: "DK",
      name: "David Kim",
      title: "Director of Risk Management",
    },
    {
      quote: "When everyone is aligned on policy, you spend less time managing exceptions and more time doing real work.",
      initials: "LC",
      name: "Laura Chen",
      title: "Legal & Compliance Lead",
    },
  ];
  const random = Math.floor(Math.random() * quotes.length);
  const quote = quotes[random];

  return (
    <div className="brand-panel relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PolicySignoff" className="w-9 h-9 rounded-lg" />
          <span className="font-serif text-xl font-medium tracking-tight">
            PolicySignoff
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <blockquote className="font-serif text-2xl leading-relaxed italic text-zinc-300">
          {quote.quote}
        </blockquote>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold">
            {quote.initials}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {quote.name}
            </p>
            <p className="text-sm text-zinc-500">
              {quote.title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  setMode,
  expiredSession,
}: {
  setMode: (mode: 'login' | 'register') => void;
  expiredSession: string | null;
}) {
  const [errors] = useState<Record<string, string>>({
    form: "These credentials do not match our records.",
  });

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12 animate-fadeUp">
      <div className="w-full max-w-sm">

        {/* Mobile brand mark */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <img src="/logo.png" alt="PolicySignoff" className="w-9 h-9 rounded-lg" />
          <span className="font-serif text-xl font-medium tracking-tight">
            PolicySignoff
          </span>
        </div>

        {expiredSession && <SessionExpired />}

        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to your account to continue
        </p>

        <form className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className={`w-full h-10 px-3 text-sm border rounded-lg bg-white placeholder:text-zinc-400 transition-shadow ${errors.form ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
              required
            />
            {errors.form && <p className="mt-1.5 text-sm text-red-600">{errors.form}</p>}
          </div>
          

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-700" htmlFor="password">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 transition-shadow"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don't have an account?
          <button 
            onClick={() => {
              setMode("register");
            }} 
            className="font-medium text-zinc-900 hover:underline ml-1 cursor-pointer"
          >
            Create one
          </button>
        </p>

      </div>
    </div>
  )
}

function RegisterForm({
  setMode,
}: {
  setMode: (mode: 'login' | 'register') => void;
}) {
  const [errors] = useState<Record<string, string>>({
    email: "The email has already been taken.",
    password: "The password confirmation does not match.",
  });

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12 animate-fadeUp">
      <div className="w-full max-w-sm">

        {/* Mobile brand mark */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <img src="/logo.png" alt="PolicySignoff" className="w-9 h-9 rounded-lg" />
          <span className="font-serif text-xl font-medium tracking-tight">
            PolicySignoff
          </span>
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Get started with your organization's policy tracking
        </p>

        <form className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Jane Doe"
              className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className={`w-full h-10 px-3 text-sm border rounded-lg bg-white placeholder:text-zinc-400 transition-shadow ${errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
              required
            />
            {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              className={`w-full h-10 px-3 text-sm border rounded-lg bg-white placeholder:text-zinc-400 transition-shadow ${errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-zinc-200'}`}
              required
            />
            {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5" htmlFor="password_confirmation">Confirm password</label>
            <input
              id="password_confirmation"
              type="password"
              placeholder="Re-enter your password"
              className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 transition-shadow"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?
          <button
            onClick={() => {
              setMode("login");
            }} 
            className="font-medium text-zinc-900 hover:underline ml-1 cursor-pointer"
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}

function SessionExpired() {
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mb-6">
      <p className="text-sm text-amber-800">
        Your session has expired. Please sign in again.
      </p>
    </div>
  );
}