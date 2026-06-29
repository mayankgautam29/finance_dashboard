"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import apiClient from "@/lib/apiClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      loginSchema.parse(formData);
      await apiClient.post("/api/auth/login", formData);
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      if (err.name === "ZodError") {
        setError(err.errors[0].message);
      } else {
        setError("Login failed. Redirecting to signup...");
        setTimeout(() => router.push("/auth/signup"), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-lg font-bold text-emerald-400">
            F
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Sign in to your finance dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              data-testid="login-email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              data-testid="login-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="input"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            data-testid="login-submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="border-t border-white/8 pt-6">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Demo accounts
            </p>
            <div className="space-y-3 rounded-xl border border-white/6 bg-black/30 p-4 text-[13px] text-zinc-300">
              <p className="text-center">
                <span className="font-medium text-zinc-100">Admin</span>{" "}
                <span className="font-mono text-zinc-400">adminuser4@gmail.com</span>{" "}
                / <span className="font-mono text-zinc-400">admin4123</span>
              </p>
              <p className="text-center">
                <span className="font-medium text-zinc-100">Analyst</span>{" "}
                <span className="font-mono text-zinc-400">analystuser@gmail.com</span>{" "}
                / <span className="font-mono text-zinc-400">analyst123</span>
              </p>
              <p className="text-center">
                <span className="font-medium text-zinc-100">Viewer</span>{" "}
                <span className="font-mono text-zinc-400">user1@gmail.com</span>{" "}
                / <span className="font-mono text-zinc-400">user123</span>
              </p>
            </div>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-medium text-white transition hover:text-emerald-400"
            onClick={() => router.push("/auth/signup")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
