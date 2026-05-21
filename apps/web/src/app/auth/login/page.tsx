'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api, ApiError } from '@/lib/api-client';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    language: string;
    theme: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    tenantSlug: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First resolve tenant slug to ID
      const tenant = await api.get<{ id: string }>(`/tenants/slug/${form.tenantSlug}`);

      // Then login
      const result = await api.post<LoginResponse>('/auth/login', {
        tenantId: tenant.id,
        email: form.email,
        password: form.password,
        deviceType: 'web',
      });

      setAuth({
        user: {
          ...result.user,
          displayName: result.user.displayName || `${result.user.firstName} ${result.user.lastName}`,
          permissions: [], // Will be populated from JWT decode
        },
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Invalid email or password');
        } else if (err.status === 403) {
          setError('Account is locked. Please try again later.');
        } else if (err.status === 404) {
          setError('Organization not found. Check your organization ID.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {
        setError('Unable to connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
            Brushia
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Enterprise Resource Planning</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Organization ID
              </label>
              <input
                type="text"
                value={form.tenantSlug}
                onChange={(e) => setForm((f) => ({ ...f, tenantSlug: e.target.value }))}
                placeholder="your-company"
                required
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <button type="button" className="text-xs text-rose-400 hover:text-rose-300">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © {new Date().getFullYear()} Brushia ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
}
