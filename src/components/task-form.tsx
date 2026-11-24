"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import { trpc } from "@/trpc/client";

interface TaskFormProps {
  mode: "create" | "edit";
  initialTask?: {
    id: string;
    titulo: string;
    descricao?: string;
  };
}

/**
 * Reusable functional component for creating or editing a task.
 * Uses React Hooks for state management, client-side validation,
 * and handles backend tRPC errors gracefully.
 */
export function TaskForm({ mode, initialTask }: TaskFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [titulo, setTitulo] = useState(initialTask?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialTask?.descricao ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createMutation = trpc.task.create.useMutation({
    onSuccess: async () => {
      setSuccessMessage("Task created successfully! Redirecting...");
      await utils.task.list.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setServerError(
        err.message || "Unexpected server error while creating the task."
      );
    },
  });

  const updateMutation = trpc.task.update.useMutation({
    onSuccess: async () => {
      setSuccessMessage("Task updated successfully! Redirecting...");
      await utils.task.list.invalidate();
      router.push("/");
      router.refresh();
    },
    onError: (err) => {
      setServerError(
        err.message || "Unexpected server error while updating the task."
      );
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError(null);
    setServerError(null);
    setSuccessMessage(null);

    // Frontend validation: block submission if title is empty or only whitespace
    const cleanTitulo = titulo.trim();
    const cleanDescricao = descricao.trim();

    if (!cleanTitulo) {
      setValidationError(
        "The Title field is required. Please enter a title for the task."
      );
      return;
    }

    if (cleanTitulo.length > 120) {
      setValidationError("Title must be at most 120 characters.");
      return;
    }

    if (cleanDescricao.length > 500) {
      setValidationError("Description must be at most 500 characters.");
      return;
    }

    if (mode === "create") {
      createMutation.mutate({
        titulo: cleanTitulo,
        descricao: cleanDescricao || undefined,
      });
    } else if (mode === "edit" && initialTask) {
      updateMutation.mutate({
        id: initialTask.id,
        titulo: cleanTitulo,
        descricao: cleanDescricao || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to task list</span>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {mode === "create"
            ? "Fill out the fields below to add a new task to the list."
            : "Update the fields below and save your changes."}
        </p>

        {/* Client or Server Error Alert */}
        {(validationError || serverError) && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{validationError || serverError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="titulo"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Review API documentation"
              disabled={isPending}
              className={`w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationError && !titulo.trim()
                  ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Description{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Add details or notes about this task..."
              disabled={isPending}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {mode === "create" ? "Create Task" : "Save Changes"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
