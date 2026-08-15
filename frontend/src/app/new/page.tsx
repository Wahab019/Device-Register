import Link from "next/link";
import DeviceForm from "../../components/DeviceForm";

export default function NewDevicePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Back to records
        </Link>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <h1 className="mb-6 text-2xl font-semibold text-slate-900">
            Add New Device Record
          </h1>

          <DeviceForm />
        </div>
      </div>
    </main>
  );
}
