import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * Context creation for tRPC requests.
 * Since we use an in-memory store without authentication, the context is minimal.
 */
export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  return {
    headers: opts?.headers,
  };
};

/**
 * Initialization of tRPC backend.
 * We use superjson to preserve types and format Zod validation errors
 * so the frontend can easily display clear error messages.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
