"use client";

import { TRPCReactProvider } from "@/trpc/client";

export function AppProviders(props: Readonly<{ children: React.ReactNode }>) {
  return <TRPCReactProvider>{props.children}</TRPCReactProvider>;
}
