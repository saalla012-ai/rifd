import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/video-provide")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/video-providers" });
  },
});
