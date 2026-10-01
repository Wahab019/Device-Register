"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DeviceForm from "../../components/DeviceForm";
import StaffHeader from "../../components/StaffHeader";
import { useAuth } from "../../lib/auth-context";

export default function NewDevicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <main className="min-h-screen px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <StaffHeader />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center text-sm font-medium text-slate-400 transition hover:text-blue-400"
        >
          <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span> Back to records
        </Link>

        <div className="glass-panel p-8 sm:p-10 relative">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] pointer-events-none"></div>
          
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 drop-shadow-sm">
            Add New Device Record
          </h1>

          <div className="relative z-10">
            <DeviceForm />
          </div>
        </div>
      </div>
    </main>
  );
}
