import { describe, test, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { orderRouter } from "./order.js";
import type { TRPCContext } from "../lib/context.js";

const mockOrder = {
  id: "order-1",
  organizationId: "org-123",
  branchId: "branch-1",
  externalOrderId: null,
  source: "pos",
  status: "pending",
  customerName: "John Doe",
  customerPhone: null,
  items: [
    { menuItemId: "item-1", name: "Pad Thai", quantity: 2, price: "80.00" },
  ],
  subtotal: "160.00",
  discount: "0",
  total: "160.00",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  acceptedAt: null,
  completedAt: null,
};

const mockOrderItem = {
  id: "order-item-1",
  orderId: "order-1",
  organizationId: "org-123",
  menuItemId: "item-1",
  name: "Pad Thai",
  quantity: 2,
  unitPrice: "80.00",
  subtotal: "160.00",
  notes: null,
  isVoided: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeCtx(
  activeOrganizationId: string | null,
  db: unknown,
  dbDirect?: unknown,
): TRPCContext {
  return {
    db,
    dbDirect: dbDirect ?? db,
    user: { id: "user-123", email: "test@example.com", name: "Test User" },
    session: { id: "session-1", userId: "user-123", activeOrganizationId },
  } as unknown as TRPCContext;
}

/** Build a mock dbDirect that supports transactions and insert chains. */
function makeTxDb(returnedOrder = mockOrder, returnedItem = mockOrderItem) {
  let insertCallCount = 0;
  const txMock = {
    insert: () => ({
      values: () => ({
        returning: () => {
          // call 0: order table → return order
          // call 1: order_item table → return order_item
          // call 2: order_item_modifier → return []
          const call = insertCallCount++;
          if (call === 0) return Promise.resolve([returnedOrder]);
          if (call === 1) return Promise.resolve([returnedItem]);
          return Promise.resolve([]);
        },
      }),
    }),
  };
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ organizationId: "org-123" }]),
        }),
      }),
    }),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(txMock),
  };
}

describe("Order Router", () => {
  describe("create", () => {
    test("creates an order and returns it", async () => {
      const db = makeTxDb();
      const caller = orderRouter.createCaller(makeCtx("org-123", db, db));
      const result = await caller.create({
        branchId: "branch-1",
        source: "pos",
        items: [
          {
            menuItemId: "item-1",
            name: "Pad Thai",
            quantity: 2,
            price: "80.00",
          },
        ],
        subtotal: "160.00",
        total: "160.00",
        customerName: "John Doe",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("pending");
      expect(result.organizationId).toBe("org-123");
    });

    test("creates an order with modifiers and returns it", async () => {
      const db = makeTxDb();
      const caller = orderRouter.createCaller(makeCtx("org-123", db, db));
      const result = await caller.create({
        branchId: "branch-1",
        source: "pos",
        items: [
          {
            menuItemId: "item-1",
            name: "Pad Thai",
            quantity: 1,
            price: "100.00",
            modifiers: [
              {
                modifierOptionId: "opt-large",
                name: "Large",
                priceAdjustment: "20.00",
              },
              { name: "Extra Spicy", priceAdjustment: "0.00" },
            ],
          },
        ],
        subtotal: "120.00",
        total: "120.00",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("pending");
    });

    test("throws 400 when user has no organization", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({ limit: () => Promise.resolve([]) }),
          }),
        }),
      };

      const caller = orderRouter.createCaller(makeCtx(null, mockDb));
      await expect(
        caller.create({
          branchId: "branch-1",
          source: "pos",
          items: [
            {
              menuItemId: "item-1",
              name: "Pad Thai",
              quantity: 2,
              price: "80.00",
            },
          ],
          subtotal: "160.00",
          total: "160.00",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("list", () => {
    test("returns orders for the current organization", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: () => Promise.resolve([mockOrder]),
            }),
          }),
        }),
      };

      const caller = orderRouter.createCaller(makeCtx("org-123", mockDb));
      const result = await caller.list({});

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe("order-1");
    });
  });

  describe("updateStatus", () => {
    test("updates order status and returns the updated order", async () => {
      const updatedOrder = {
        ...mockOrder,
        status: "accepted",
        acceptedAt: new Date(),
      };
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ organizationId: "org-123" }]),
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([updatedOrder]),
            }),
          }),
        }),
      };

      const caller = orderRouter.createCaller(makeCtx("org-123", mockDb));
      const result = await caller.updateStatus({
        id: "order-1",
        status: "accepted",
      });

      expect(result.status).toBe("accepted");
    });

    test("throws NOT_FOUND when order does not belong to organization", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ organizationId: "org-123" }]),
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([]), // No match
            }),
          }),
        }),
      };

      const caller = orderRouter.createCaller(makeCtx("org-123", mockDb));
      await expect(
        caller.updateStatus({ id: "nonexistent", status: "accepted" }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
