"use client";

import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z, ZodError } from "zod";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupData = z.infer<typeof signupSchema>;

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupData>({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      signupSchema.parse(formData);
      await apiClient.post("/api/auth/signup", formData);
      router.push("/home");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message || "Invalid input");
      } else {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white">
      <div className="card w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Create an Account
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            New accounts start as viewers. Admins can upgrade roles later.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              name="username"
              placeholder="yourname"
              value={formData.username}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            className="cursor-pointer font-medium text-white hover:underline"
            onClick={() => router.push("/auth/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
