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
      router.push("/");
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
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={onSubmit}
        className="bg-gray-800 p-8 rounded-xl shadow-lg w-80"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mb-4 rounded bg-gray-700 outline-none"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 mb-4 rounded bg-gray-700 outline-none"
        />

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Signup Redirect */}
        <p className="text-sm mt-4 text-center">
          Don’t have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Signup
          </span>
        </p>
      </form>
    </div>
  );
}