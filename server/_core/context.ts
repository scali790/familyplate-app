import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema.js";
import { sdk } from "./sdk.js";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    console.log('[tRPC Context] User authenticated:', user ? `${user.email} (ID: ${user.id})` : 'null');
  } catch (error) {
    // Authentication is optional for public procedures.
    console.log('[tRPC Context] Authentication failed:', error instanceof Error ? error.message : error);
    console.log('[tRPC Context] Headers:', {
      authorization: opts.req.headers.authorization,
      cookie: opts.req.headers.cookie ? 'present' : 'missing'
    });
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
