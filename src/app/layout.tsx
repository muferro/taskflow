import type { Metadata } from "next";
import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskFlow | Task Manager (Next.js 15 & tRPC)",
  description:
    "Simple task management system built with Next.js 15, tRPC, SSR, and Infinite Scroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <TRPCProvider>
          <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold text-lg text-slate-900 hover:text-blue-600 transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span>TaskFlow</span>
              </Link>

              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Next.js 15 + tRPC + In-Memory Store (SSR &amp; Infinite Scroll)
          </footer>
        </TRPCProvider>
      </body>
    </html>
  );
}
