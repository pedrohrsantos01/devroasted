export async function triggerRoastProcessing(_: {
  db: typeof import("@/db/client").db;
  roastId: string;
}) {
  return Promise.resolve();
}
