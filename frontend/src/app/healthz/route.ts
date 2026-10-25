// Liveness probe for the container orchestrator.
//
// Deliberately touches nothing else: it answers "is this Next server accepting
// requests", not "is the whole system up". A backend or database outage shows
// up on that container's own healthcheck, rather than restarting a frontend
// that is serving perfectly well.
//
// GET route handlers are dynamic by default since Next 15, so no cache opt-out
// is needed for the response to reflect the running server.
export async function GET() {
  return Response.json({ status: "ok" });
}
