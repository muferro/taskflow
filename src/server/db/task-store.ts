export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number; // Unix timestamp in milliseconds
}

/**
 * In-memory database store.
 * Using `globalThis` ensures that the in-memory task list persists across
 * Next.js Hot Module Replacement (HMR) reloads and across Server Components / API routes
 * within the same Node.js process.
 */
const globalForTasks = globalThis as unknown as {
  tasksStore: Task[] | undefined;
  tasksStoreSeedVersion: number | undefined;
};

const SEED_VERSION = 3; // Incremented to force reload of the 100 English tasks

const taskActions = [
  "Refactor",
  "Implement",
  "Review",
  "Fix bug in",
  "Optimize performance of",
  "Write unit tests for",
  "Document",
  "Update dependencies for",
  "Validate security in",
  "Configure CI/CD pipeline for",
  "Analyze metrics of",
  "Design architecture for",
  "Migrate database of",
  "Integrate webhook for",
  "Adjust responsive layout in",
];

const taskSubjects = [
  "JWT authentication module",
  "checkout and payments page",
  "Infinite Scroll task list",
  "financial reports endpoint",
  "transactional email service",
  "server-side query caching",
  "customer registration form",
  "admin metrics dashboard",
  "CSV and PDF data export",
  "payment gateway integration",
  "real-time notification system",
  "Next.js 15 tRPC procedures",
  "advanced product search filter",
  "role-based access control (RBAC)",
  "cloud storage image upload",
  "global frontend error handling",
  "Server-Side Rendering component hydration",
  "Zod schema validation layer",
  "ERP inventory synchronization",
  "production log monitoring and alerts",
];

const taskContexts = [
  "Ensure response time stays below 200ms during load testing.",
  "Check compatibility with mobile devices and modern browsers.",
  "Follow team coding standards and verify strict TypeScript types.",
  "Review edge cases when users submit empty optional fields.",
  "Monitor application logs after deploying to the staging environment.",
  "Confirm with the product team that user feedback messages are clear.",
  "Reduce memory usage during high concurrent traffic spikes.",
  "Add proper fallback handling in case the external service times out.",
  "Include practical usage examples in the repository documentation.",
  "Run the full regression suite before opening the Pull Request.",
];

const initialSeedTasks: Task[] = Array.from({ length: 100 }, (_, index) => {
  const num = index + 1;
  const action = taskActions[(index * 7 + 3) % taskActions.length];
  const subject = taskSubjects[(index * 11 + 5) % taskSubjects.length];
  const context = taskContexts[(index * 13 + 2) % taskContexts.length];

  // Leave ~15% of tasks without description to showcase the optional description field
  const hasDescription = index % 7 !== 0;

  return {
    id: `task-${num}`,
    titulo: `${action} ${subject} (#${num})`,
    descricao: hasDescription
      ? `${context} Priority scheduled in the current sprint for deliverable #${num}.`
      : undefined,
    // Stagger timestamps so task #100 is the newest and task #1 is the oldest
    dataCriacao: Date.now() - (100 - num) * 1000 * 60 * 25,
  };
}).reverse();

if (
  !globalForTasks.tasksStore ||
  globalForTasks.tasksStoreSeedVersion !== SEED_VERSION
) {
  globalForTasks.tasksStore = initialSeedTasks;
  globalForTasks.tasksStoreSeedVersion = SEED_VERSION;
}

export const taskStore = {
  getAll(): Task[] {
    // Always return sorted by newest first (dataCriacao DESC)
    return [...(globalForTasks.tasksStore ?? [])].sort(
      (a, b) => b.dataCriacao - a.dataCriacao
    );
  },

  getById(id: string): Task | undefined {
    return (globalForTasks.tasksStore ?? []).find((t) => t.id === id);
  },

  create(data: { titulo: string; descricao?: string }): Task {
    const newTask: Task = {
      id: crypto.randomUUID(),
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || undefined,
      dataCriacao: Date.now(),
    };
    globalForTasks.tasksStore = [newTask, ...(globalForTasks.tasksStore ?? [])];
    return newTask;
  },

  update(
    id: string,
    data: { titulo: string; descricao?: string }
  ): Task | null {
    const store = globalForTasks.tasksStore ?? [];
    const index = store.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;
    }

    const updatedTask: Task = {
      ...store[index],
      titulo: data.titulo.trim(),
      descricao: data.descricao?.trim() || undefined,
    };

    store[index] = updatedTask;
    globalForTasks.tasksStore = [...store];
    return updatedTask;
  },

  delete(id: string): boolean {
    const store = globalForTasks.tasksStore ?? [];
    const exists = store.some((t) => t.id === id);
    if (!exists) {
      return false;
    }
    globalForTasks.tasksStore = store.filter((t) => t.id !== id);
    return true;
  },

  deleteAll(): number {
    const count = (globalForTasks.tasksStore ?? []).length;
    globalForTasks.tasksStore = [];
    return count;
  },
};
