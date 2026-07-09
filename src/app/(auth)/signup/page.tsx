import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { HeartHandshake } from "lucide-react";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <HeartHandshake size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">RelateLoop</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your private relationship memory
          </p>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Create account</h2>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <form action={signup} className="space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                className="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
                placeholder="At least 8 characters"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Create account
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
