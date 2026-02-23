import { describe, test, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { menuRouter } from "./menu.js";
import type { TRPCContext } from "../lib/context.js";

describe("Menu Router - Legacy Session Handling", () => {
  test("listItems should handle sessions without activeOrganizationId by fetching user's first organization", async () => {
    // Setup: Mock database to return a user membership
    const mockMembership = { organizationId: "org-123" };
    const mockMenuItems = [
      {
        id: "item-1",
        sku: "SKU-001",
        name: "Test Item",
        organizationId: "org-123",
        price: "10.00",
      },
    ];

    let queryCount = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            queryCount++;
            // First query is for member table (fallback lookup)
            if (queryCount === 1) {
              return {
                limit: () => Promise.resolve([mockMembership]),
              };
            }
            // Second query is for menuItem table (actual data)
            return {
              orderBy: () => Promise.resolve(mockMenuItems),
            };
          },
        }),
      }),
    };

    const ctx = {
      db: mockDb,
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
      session: {
        id: "session-123",
        userId: "user-123",
        activeOrganizationId: null, // Legacy session without org
      },
    } as unknown as TRPCContext;

    // Call the procedure
    const caller = menuRouter.createCaller(ctx);
    const result = await caller.listItems({});

    // Should successfully return menu items
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  test("listItems should throw 400 when session has no activeOrganizationId and user has no memberships", async () => {
    // Setup: Mock database to return no memberships
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]), // No memberships
            orderBy: () => Promise.resolve([]),
          }),
        }),
      }),
    };

    const ctx = {
      db: mockDb,
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
      session: {
        id: "session-123",
        userId: "user-123",
        activeOrganizationId: null,
      },
    } as unknown as TRPCContext;

    // Should throw error when no org available
    const caller = menuRouter.createCaller(ctx);

    await expect(caller.listItems({})).rejects.toThrow(TRPCError);
    await expect(caller.listItems({})).rejects.toThrow(
      "No organization selected",
    );
  });

  test("listItems should use activeOrganizationId when present in session", async () => {
    // Setup: Mock database
    const mockMenuItems = [
      {
        id: "item-1",
        sku: "SKU-001",
        name: "Test Item",
        organizationId: "org-456",
        price: "10.00",
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(mockMenuItems),
          }),
        }),
      }),
    };

    const ctx = {
      db: mockDb,
      user: { id: "user-123", email: "test@example.com", name: "Test User" },
      session: {
        id: "session-123",
        userId: "user-123",
        activeOrganizationId: "org-456", // Session with org
      },
    } as unknown as TRPCContext;

    // Should use the existing activeOrganizationId
    const caller = menuRouter.createCaller(ctx);
    const result = await caller.listItems({});

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
