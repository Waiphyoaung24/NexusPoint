import { describe, it } from "vitest";

describe("table router", () => {
  describe("table.list", () => {
    it("returns all active tables for a branch", async () => {
      // Test: list returns tables sorted by number
      // Mock ctx with authenticated user and branch
    });
  });

  describe("table.create", () => {
    it("creates a new table for a branch", async () => {
      // Test: creates table with default position
    });
  });

  describe("table.updatePosition", () => {
    it("updates table position on drag-drop", async () => {
      // Test: position stored as integers
    });
  });
});
