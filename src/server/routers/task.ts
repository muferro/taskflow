import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { taskStore } from "../db/task-store";

/**
 * Shared Zod validation schema for creating and updating tasks.
 * Guarantees that no task can be created or updated with an empty title.
 */
const taskInputSchema = z.object({
  titulo: z
    .string({ required_error: "Task title is required." })
    .trim()
    .min(1, "Task title cannot be empty.")
    .max(120, "Task title must be at most 120 characters."),
  descricao: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters.")
    .optional(),
});

export const taskRouter = createTRPCRouter({
  /**
   * List tasks with cursor-based pagination to support Infinite Scroll.
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(6),
          cursor: z.number().nullish(), // Offset index used as cursor
        })
        .optional()
    )
    .query(({ input }) => {
      const limit = input?.limit ?? 6;
      const cursor = input?.cursor ?? 0;

      const allTasks = taskStore.getAll();
      const items = allTasks.slice(cursor, cursor + limit);
      const nextCursor =
        cursor + limit < allTasks.length ? cursor + limit : undefined;

      return {
        items,
        nextCursor,
        total: allTasks.length,
      };
    }),

  /**
   * Fetch a single task by ID (used on the edit screen).
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1, "Invalid task ID.") }))
    .query(({ input }) => {
      const task = taskStore.getById(input.id);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Task with ID "${input.id}" was not found.`,
        });
      }

      return task;
    }),

  /**
   * Create a new task.
   */
  create: publicProcedure.input(taskInputSchema).mutation(({ input }) => {
    const created = taskStore.create({
      titulo: input.titulo,
      descricao: input.descricao,
    });

    return created;
  }),

  /**
   * Update an existing task by ID.
   * Throws NOT_FOUND if the task does not exist.
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Task ID is required."),
        titulo: taskInputSchema.shape.titulo,
        descricao: taskInputSchema.shape.descricao,
      })
    )
    .mutation(({ input }) => {
      const updated = taskStore.update(input.id, {
        titulo: input.titulo,
        descricao: input.descricao,
      });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Could not update: the requested task does not exist or has already been removed.",
        });
      }

      return updated;
    }),

  /**
   * Delete a task by ID.
   * Throws NOT_FOUND if the task does not exist.
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().min(1, "Task ID is required."),
      })
    )
    .mutation(({ input }) => {
      const deleted = taskStore.delete(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Could not delete: the task was not found or has already been removed.",
        });
      }

      return { success: true, deletedId: input.id };
    }),

  /**
   * Delete all tasks at once.
   */
  deleteAll: publicProcedure.mutation(() => {
    const deletedCount = taskStore.deleteAll();
    return { success: true, deletedCount };
  }),
});
