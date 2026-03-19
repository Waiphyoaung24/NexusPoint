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

    test("creates order with custom (no menuItemId) item", async () => {
      const db = makeTxDb();
      const caller = orderRouter.createCaller(makeCtx("org-123", db, db));
      const result = await caller.create({
        source: "pos",
        items: [{ name: "Special Plate", quantity: 1, price: "99.00" }],
        subtotal: "99.00",
        total: "99.00",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
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

  describe("voidItem", () => {
    test("voids a single item and creates void_log entry", async () => {
      let insertedVoidLog: Record<string, unknown> | null = null;
      let updatedOrderItem: Record<string, unknown> | null = null;
      let _updatedOrder: Record<string, unknown> | null = null;

      const mockTx = {
        insert: (_table: unknown) => ({
          values: (values: Record<string, unknown>) => {
            insertedVoidLog = values;
            return {
              returning: () => Promise.resolve([{ id: "void-1", ...values }]),
            };
          },
        }),
        update: (_table: unknown) => ({
          set: (values: Record<string, unknown>) => {
            if ("isVoided" in values) {
              updatedOrderItem = values;
            } else if ("total" in values) {
              _updatedOrder = values;
            }
            return {
              where: () => ({
                returning: () =>
                  Promise.resolve([{ id: "order-item-1", ...values }]),
              }),
            };
          },
        }),
        select: () => ({
          from: () => ({
            where: () =>
              Promise.resolve([
                { ...mockOrderItem, isVoided: false },
                {
                  ...mockOrderItem,
                  id: "order-item-2",
                  unitPrice: "50.00",
                  subtotal: "50.00",
                },
              ]),
          }),
        }),
      };

      const db = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ organizationId: "org-123" }]),
            }),
          }),
        }),
      };

      const dbDirect = {
        transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
          return fn(mockTx);
        },
      };

      const ctx = makeCtx("org-123", db, dbDirect);
      const caller = orderRouter.createCaller(ctx);

      await caller.voidItem({
        orderItemId: "order-item-1",
        orderId: "order-1",
        reason: "Customer changed mind",
        requesterId: "user-1",
        approverId: "manager-1",
      });

      expect(insertedVoidLog).toBeTruthy();
      expect(insertedVoidLog!.voidType).toBe("item");
      expect(insertedVoidLog!.orderItemId).toBe("order-item-1");
      expect(insertedVoidLog!.reason).toBe("Customer changed mind");
      expect(updatedOrderItem!.isVoided).toBe(true);
    });

    test("rejects void for non-existent order", async () => {
      const db = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
      };

      const ctx = makeCtx("org-123", db);
      const caller = orderRouter.createCaller(ctx);

      await expect(
        caller.voidItem({
          orderItemId: "x",
          orderId: "x",
          reason: "test",
          requesterId: "user-1",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("voidOrder", () => {
    test("cancels order, voids all items, and creates void_log", async () => {
      let insertedVoidLog: Record<string, unknown> | null = null;
      let updatedOrder: Record<string, unknown> | null = null;
      let voidedAllItems = false;

      const mockTx = {
        insert: (_table: unknown) => ({
          values: (values: Record<string, unknown>) => {
            insertedVoidLog = values;
            return {
              returning: () => Promise.resolve([{ id: "void-2", ...values }]),
            };
          },
        }),
        update: (_table: unknown) => ({
          set: (values: Record<string, unknown>) => {
            if ("status" in values && values.status === "cancelled") {
              updatedOrder = values;
            }
            if ("isVoided" in values) {
              voidedAllItems = true;
            }
            return {
              where: () => ({
                returning: () =>
                  Promise.resolve([{ id: "order-1", ...values }]),
              }),
            };
          },
        }),
      };

      const db = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ organizationId: "org-123" }]),
            }),
          }),
        }),
      };

      const dbDirect = {
        transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
          fn(mockTx),
      };

      const ctx = makeCtx("org-123", db, dbDirect);
      const caller = orderRouter.createCaller(ctx);

      await caller.voidOrder({
        orderId: "order-1",
        reason: "Wrong table",
        requesterId: "user-1",
        approverId: "manager-1",
      });

      expect(updatedOrder).toBeTruthy();
      expect(updatedOrder!.status).toBe("cancelled");
      expect(insertedVoidLog!.voidType).toBe("order");
      expect(voidedAllItems).toBe(true);
    });
  });
});
