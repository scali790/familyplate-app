import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/routers";
import { createContext } from "@/server/trpc/context";

// Force Node.js runtime (required for Mailjet + Postgres)
export const runtime = "nodejs";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error('[tRPC onError]', {
        path,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        code: error.code,
      });
    },
  });

export { handler as GET, handler as POST };
