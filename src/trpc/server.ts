import { headers } from "next/headers";
import { createCaller } from "@/server/root";
import { createTRPCContext } from "@/server/trpc";

/**
 * Server-side tRPC caller for Next.js 15 Server Components (SSR).
 * Allows calling tRPC procedures directly on the server during page rendering.
 */
export const getServerTrpc = async () => {
  const heads = await headers();
  const ctx = await createTRPCContext({ headers: heads });
  return createCaller(ctx);
};
