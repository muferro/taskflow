"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import type { Task } from "@/server/db/task-store";

interface InitialPageData {
  items: Task[];
  nextCursor: number | undefined;
  total: number;
}

interface TaskListClientProps {
  initialData: InitialPageData;
  pageSize: number;
}

/**
 * Client Component that receives SSR pre-loaded tasks (`initialData`)
 * and manages Infinite Scroll + Direct Deletion with user feedback.
 */
export function TaskListClient({
  initialData,
  pageSize,
}: TaskListClientProps) {
  const utils = trpc.useUtils();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Visual feedback state for success/error notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Track which task ID is currently being deleted for granular loading state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Infinite Query hydrated with SSR initialData so the first page is rendered
   * immediately on the server without waiting for a client fetch.
   */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
    refetch,
  } = trpc.task.list.useInfiniteQuery(
    { limit: pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [initialData],
        pageParams: [undefined],
      },
      // Ensure fresh data when returning from Create/Edit pages
      refetchOnMount: "always",
    }
  );

  /**
   * Delete mutation with visual feedback and automatic list invalidation.
   */
  const deleteMutation = trpc.task.delete.useMutation({
    onMutate: ({ id }) => {
      setDeletingId(id);
      setFeedback(null);
    },
    onSuccess: async () => {
      setFeedback({
        type: "success",
        message: "Task deleted successfully!",
      });
      await utils.task.list.invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.message || "An error occurred while deleting the task.",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  /**
   * Delete all tasks mutation with visual feedback and list invalidation.
   */
  const deleteAllMutation = trpc.task.deleteAll.useMutation({
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: async (res) => {
      setFeedback({
        type: "success",
        message: `All tasks (${res.deletedCount}) have been deleted successfully!`,
      });
      await utils.task.list.invalidate();
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message:
          err.message || "An error occurred while deleting all tasks.",
      });
    },
  });

  /**
   * IntersectionObserver for Infinite Scroll:
   * Automatically fetches the next page when the user scrolls near the bottom sentinel.
   */
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-hide success banner after 4 seconds
  useEffect(() => {
    if (feedback?.type === "success") {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const tasks = data?.pages.flatMap((page) => page.items) ?? [];
  const totalTasks = data?.pages[0]?.total ?? 0;

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          <p className="text-sm text-slate-600">
            Showing {tasks.length} of {totalTasks}{" "}
            {totalTasks === 1 ? "task" : "tasks"}
          </p>
        </div>

        {totalTasks > 0 && (
          <button
            type="button"
            disabled={deleteAllMutation.isPending}
            onClick={() => deleteAllMutation.mutate()}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            {deleteAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>
              {deleteAllMutation.isPending
                ? "Deleting all..."
                : "Delete All Tasks"}
            </span>
          </button>
        )}
      </div>

      {/* Feedback Banner (Success / Error) */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Query Error State */}
      {isError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>
            Error loading tasks: {error?.message || "Unknown error"}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded font-medium text-xs"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-slate-600 font-medium">No tasks found.</p>
          <p className="text-sm text-slate-500">
            Get started by creating your first task using the button below.
          </p>
          <div className="pt-2">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Task Cards List */
        <ul className="space-y-3">
          {tasks.map((task) => {
            const isDeletingThis = deletingId === task.id;

            return (
              <li
                key={task.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 break-words">
                    {task.titulo}
                  </h2>

                  {task.descricao ? (
                    <p className="text-sm text-slate-600 break-words leading-relaxed">
                      {task.descricao}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-400">
                      No description provided
                    </p>
                  )}

                  <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created on {formatDate(task.dataCriacao)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>

                  <button
                    type="button"
                    disabled={isDeletingThis}
                    onClick={() => deleteMutation.mutate({ id: task.id })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {isDeletingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isDeletingThis ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Infinite Scroll Sentinel & Loading Indicator */}
      <div ref={loadMoreRef} className="py-4 flex flex-col items-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading more tasks...</span>
          </div>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
          >
            Load more tasks
          </button>
        ) : tasks.length > 0 ? (
          <p className="text-xs text-slate-400">All tasks have been loaded.</p>
        ) : null}
      </div>
    </div>
  );
}
