"use client";

import { use } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { TaskForm } from "@/components/task-form";

export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: task,
    isLoading,
    isError,
    error,
  } = trpc.task.getById.useQuery({ id }, { retry: false });

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm">Loading task data...</p>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to task list</span>
        </Link>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800 space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Error loading task</span>
          </div>
          <p className="text-sm">
            {error?.message || "The requested task could not be found."}
          </p>
        </div>
      </div>
    );
  }

  return <TaskForm mode="edit" initialTask={task} />;
}
