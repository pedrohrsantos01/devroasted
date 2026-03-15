import { initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";

import { db } from "@/db/client";

export interface TRPCContext {
  db: typeof db;
  headers: Headers;
  source: "route-handler" | "rsc";
}

async function createContextInner(input: {
  headers: Headers;
  source: TRPCContext["source"];
}): Promise<TRPCContext> {
  return {
    db,
    headers: input.headers,
    source: input.source,
  };
}

export const createTRPCContext = cache(async () => {
  const requestHeaders = new Headers();

  requestHeaders.set("x-trpc-source", "rsc");

  return createContextInner({
    headers: requestHeaders,
    source: "rsc",
  });
});

export function createTRPCContextFromHeaders(headers: Headers) {
  const requestHeaders = new Headers(headers);

  requestHeaders.set("x-trpc-source", "route-handler");

  return createContextInner({
    headers: requestHeaders,
    source: "route-handler",
  });
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
