import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  adminLogin,
  hasAdminToken,
  saveAdminToken,
} from "../../services/adminApi.js";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hasAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your admin email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await adminLogin({
        email: email.trim().toLowerCase(),
        password,
      });

      const token = response?.data?.token;

      if (!token) {
        throw new Error("Login succeeded but no admin token was returned.");
      }

      saveAdminToken(token);

      navigate("/admin", {
        replace: true,
      });
    } catch (error) {
      setError(
        error.message || "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="admin-login-layout">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xl shadow-cyan-500/20">
              <Sparkles size={28} strokeWidth={2.2} />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Dholki Nights
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Event Admin Console
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_30px_100px_rgba(15,118,110,0.12)] backdrop-blur-2xl sm:p-8">
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                <ShieldCheck size={14} />
                Secure Admin Access
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Sign in to manage Dholki Nights 2026.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Sign in to Admin
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs font-medium leading-5 text-slate-400">
                Authorized administrators only.
                <br />
                Keep your credentials private.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium text-slate-400">
            Dholki Nights • Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
