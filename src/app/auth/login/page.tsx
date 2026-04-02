"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import axios from "axios";

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
      await axios.post("/api/auth/login", formData);
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
      <div className="card w-full max-w-md">

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Login to your finance dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">

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
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="input w-full"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>
        <p className="text-sm text-gray-400 mt-6 text-center">
          Don’t have an account?{" "}
          <span
            className="text-white font-medium cursor-pointer hover:underline"
            onClick={() => router.push("/auth/signup")}
          >
            Signup
          </span>
        </p>

      </div>
    </div>
  );
}