"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength indicator
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel =
    passedChecks === 0
      ? ""
      : passedChecks <= 2
        ? "Weak"
        : passedChecks === 3
          ? "Good"
          : "Strong";
  const strengthColor =
    passedChecks <= 2
      ? "bg-red-500"
      : passedChecks === 3
        ? "bg-yellow-500"
        : "bg-emerald-500";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please check your connection.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold gradient-text">Zoltai</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Create Your Account</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Join Zoltai for free and discover the best AI tools
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-2xl border border-card-border bg-card-bg space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Hidden fields to prevent browser autocomplete */}
          <input type="text" name="fake_user" autoComplete="username" style={{ display: "none" }} tabIndex={-1} />
          <input type="password" name="fake_pass" autoComplete="current-password" style={{ display: "none" }} tabIndex={-1} />

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              name="zoltai_name_field"
              autoComplete="new-password"
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${(passedChecks / 4) * 100}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passedChecks <= 2
                        ? "text-red-400"
                        : passedChecks === 3
                          ? "text-yellow-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { label: "8+ characters", ok: passwordChecks.length },
                    { label: "Uppercase letter", ok: passwordChecks.uppercase },
                    { label: "Lowercase letter", ok: passwordChecks.lowercase },
                    { label: "Number", ok: passwordChecks.number },
                  ].map((check) => (
                    <span
                      key={check.label}
                      className={`flex items-center gap-1 ${check.ok ? "text-emerald-400" : "text-zinc-600"}`}
                    >
                      {check.ok ? "✓" : "○"} {check.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passedChecks < 4}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Free Account"
            )}
          </button>

          <p className="text-xs text-zinc-600 text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-purple-400 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-purple-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in
          </Link>
        </p>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
}
