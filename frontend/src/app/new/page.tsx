import Link from "next/link";
import DeviceForm from "../../components/DeviceForm";

export default function NewDevicePage() {
  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl relative z-10">
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
