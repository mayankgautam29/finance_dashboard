"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import axios from "axios";
import { ZodError } from "zod";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Viewer", "Analyst", "Admin"]),
});

type SignupData = z.infer<typeof signupSchema>;

export default function Signup() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignupData>({
    username: "",
    email: "",
    password: "",
    role: "Viewer",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (role: SignupData["role"]) => {
    setFormData({
      ...formData,
      role,
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      signupSchema.parse(formData);

      await axios.post("/api/auth/signup", formData);

      router.push("/home");
      router.refresh();
    } catch (err: any) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message || "Invalid input");
      } else {
        setError(err.response?.data?.error || "Signup failed");
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
            Create an Account
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Start managing your finances smarter
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
          <div>
            <label className="label">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              {["Viewer", "Analyst", "Admin"].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() =>
                    handleRoleChange(role as SignupData["role"])
                  }
                  className={`role-btn ${
                    formData.role === role ? "active-role" : ""
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Creating account..." : "Signup"}
          </button>

        </form>
        <p className="text-sm text-gray-400 mt-6 text-center">
          Already have an account?{" "}
          <span
            className="text-white font-medium cursor-pointer hover:underline"
            onClick={() => router.push("/auth/login")}
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}