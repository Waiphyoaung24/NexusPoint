import { atom } from "jotai";
import { describe, it, expect, vi } from "vitest";

// Mock the store module to avoid atomWithStorage needing real localStorage
vi.mock("@/lib/store", () => ({
  currentBranchAtom: atom(null),
}));

// Mock trpc to avoid import side effects
vi.mock("@/lib/trpc", () => ({
  api: {
    branch: {
      list: {
        queryOptions: () => ({
          queryKey: ["branch", "list"],
          queryFn: async () => [],
          enabled: false,
        }),
      },
    },
  },
}));

// Mock session query
vi.mock("@/lib/queries/session", () => ({
  useSessionQuery: () => ({ data: null }),
}));

describe("useBranchAutoSelect", () => {
  it("should be importable", async () => {
    const mod = await import("../use-branch-auto-select");
    expect(mod.useBranchAutoSelect).toBeDefined();
  });
});
