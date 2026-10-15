import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata is defined at the root so every route has a useful browser title
// and description without duplicating head configuration in each page.
export const metadata: Metadata = {
  title: "Device Register & Tracking",
  description: "Device tracking and service register system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // The layout owns global fonts, notifications, background decoration, and
  // the content stacking context shared by every dashboard route.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            style: { background: '#241810', color: '#F5EBE1', border: '1px solid rgba(153, 126, 103, 0.4)' } 
          }} 
        />
        {/* Animated background light keeps the dark glass surfaces legible
          while remaining outside the interaction layer. */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-neutral-espresso/35 blur-[130px] animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-neutral-taupe/25 blur-[130px] animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-[40%] left-[55%] w-[35%] h-[35%] rounded-full bg-neutral-peach/15 blur-[110px] animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        {/* Main content wrapped in AuthProvider for employee session state */}
        <AuthProvider>
          <div className="flex-1 relative z-10 flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
