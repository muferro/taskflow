import { createCallerFactory, createTRPCRouter } from "./trpc";
import { taskRouter } from "./routers/task";

/**
 * Main tRPC Application Router.
 */
export const appRouter = createTRPCRouter({
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Server-side caller used by Next.js Server Components for SSR pre-loading.
 */
export const createCaller = createCallerFactory(appRouter);
