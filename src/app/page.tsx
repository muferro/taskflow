import { getServerTrpc } from "@/trpc/server";
import { TaskListClient } from "@/components/task-list-client";

/**
 * Force dynamic rendering (SSR) so every page request pre-loads
 * the current in-memory tasks on the server before sending HTML to the client.
 */
export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

export default async function HomePage() {
  const serverTrpc = await getServerTrpc();
  const initialData = await serverTrpc.task.list({ limit: PAGE_SIZE });

  return <TaskListClient initialData={initialData} pageSize={PAGE_SIZE} />;
}
