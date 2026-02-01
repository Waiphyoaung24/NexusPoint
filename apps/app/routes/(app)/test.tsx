import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/test")({
  component: TestPage,
});

function TestPage() {
  return <div className="p-6"></div>;
}
