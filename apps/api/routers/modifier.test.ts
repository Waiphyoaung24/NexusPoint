import { describe, test, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { modifierRouter } from "./modifier.js";
import type { TRPCContext } from "../lib/context.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockGroup = {
  id: "group-1",
  organizationId: "org-123",
  branchId: null,
  name: "Size",
  nameTh: null,
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOption = {
  id: "opt-1",
  organizationId: "org-123",
  modifierGroupId: "group-1",
  name: "Small",
  nameTh: null,
  priceAdjustment: "0",
  isDefault: true,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLink = {
  id: "link-1",
  menuItemId: "item-1",
  modifierGroupId: "group-1",
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(
  activeOrganizationId: string | null,
  db: unknown,
): TRPCContext {
  return {
    db,
    user: { id: "user-1", email: "test@example.com", name: "Tester" },
    session: { id: "sess-1", userId: "user-1", activeOrganizationId },
  } as unknown as TRPCContext;
}

/** Builds a mock db where sequential select() calls return different values. */
function makeSelectDb(...results: unknown[]) {
  let call = 0;
  const select = () => ({
    from: () => ({
      where: () => ({
        orderBy: () => Promise.resolve(results[call++] ?? []),
        limit: () => Promise.resolve(results[call++] ?? []),
        innerJoin: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(results[call++] ?? []),
          }),
        }),
      }),
    }),
  });
  return { select };
}

// ─── list ──────────────────────────────────────────────────────────────────────

describe("modifier.list", () => {
  test("returns groups with nested options", async () => {
    const db = makeSelectDb([mockGroup], [mockOption]);
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.list({});

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe("group-1");
    expect(result[0].options).toHaveLength(1);
    expect(result[0].options[0].id).toBe("opt-1");
  });

  test("nests options under the correct group", async () => {
    const group2 = { ...mockGroup, id: "group-2" };
    const optForGroup2 = {
      ...mockOption,
      id: "opt-2",
      modifierGroupId: "group-2",
    };
    const db = makeSelectDb([mockGroup, group2], [mockOption, optForGroup2]);
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.list({});

    expect(result[0].options[0].id).toBe("opt-1");
    expect(result[1].options[0].id).toBe("opt-2");
  });
});

// ─── getById ──────────────────────────────────────────────────────────────────

describe("modifier.getById", () => {
  test("returns group with options", async () => {
    // Call 1: select group (limit), Call 2: select options (orderBy)
    let call = 0;
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve(call++ === 0 ? [mockGroup] : []),
            orderBy: () => Promise.resolve([mockOption]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.getById({ id: "group-1" });

    expect(result.id).toBe("group-1");
    expect(result.options).toBeDefined();
  });

  test("throws NOT_FOUND when group belongs to different org", async () => {
    const db = makeSelectDb([]); // empty = org mismatch
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(caller.getById({ id: "group-other" })).rejects.toThrow(
      TRPCError,
    );
  });
});

// ─── create ───────────────────────────────────────────────────────────────────

describe("modifier.create", () => {
  test("creates a group when caller is owner", async () => {
    // Call 1: requireManagerRole → select member
    // Call 2: insert modifierGroup → returning
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([mockGroup]),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.create({
      name: "Size",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      sortOrder: 0,
    });

    expect(result.id).toBe("group-1");
    expect(result.name).toBe("Size");
  });

  test("throws FORBIDDEN when caller role is member", async () => {
    const db = {
      select: makeSelectDb([{ role: "member" }]).select,
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.create({
        name: "Size",
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("throws FORBIDDEN when caller has no membership", async () => {
    const db = {
      select: makeSelectDb([]).select, // empty = no membership row
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.create({
        name: "Size",
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ─── update ───────────────────────────────────────────────────────────────────

describe("modifier.update", () => {
  test("updates a group and returns it", async () => {
    const updated = { ...mockGroup, name: "Temperature" };
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([updated]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.update({ id: "group-1", name: "Temperature" });

    expect(result.name).toBe("Temperature");
  });

  test("throws NOT_FOUND when group does not exist in org", async () => {
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([]), // no match
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.update({ id: "ghost", name: "X" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

// ─── delete (soft) ────────────────────────────────────────────────────────────

describe("modifier.delete", () => {
  test("soft-deletes a group (isActive = false)", async () => {
    const softDeleted = { ...mockGroup, isActive: false };
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([softDeleted]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.delete({ id: "group-1" });

    expect(result.isActive).toBe(false); // soft delete, record still exists
  });

  test("throws NOT_FOUND when group not in org", async () => {
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(caller.delete({ id: "ghost" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

// ─── addOption / updateOption / deleteOption ─────────────────────────────────

describe("modifier.addOption", () => {
  test("adds an option to a group", async () => {
    // Call 1: role check, Call 2: group ownership check
    const db = {
      select: makeSelectDb([{ role: "owner" }], [{ id: "group-1" }]).select,
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([mockOption]),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.addOption({
      modifierGroupId: "group-1",
      name: "Small",
      priceAdjustment: "0",
      isDefault: true,
      sortOrder: 0,
    });

    expect(result.id).toBe("opt-1");
    expect(result.modifierGroupId).toBe("group-1");
  });

  test("throws NOT_FOUND when group does not belong to org", async () => {
    const db = {
      select: makeSelectDb([{ role: "owner" }], []).select, // group lookup → empty
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.addOption({
        modifierGroupId: "ghost",
        name: "X",
        priceAdjustment: "0",
        isDefault: false,
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("modifier.deleteOption", () => {
  test("soft-deletes an option", async () => {
    const softDeleted = { ...mockOption, isActive: false };
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([softDeleted]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.deleteOption({ id: "opt-1" });

    expect(result.isActive).toBe(false);
  });
});

// ─── assignToItem / unassignFromItem ─────────────────────────────────────────

describe("modifier.assignToItem", () => {
  test("assigns a modifier group to a menu item (idempotent upsert)", async () => {
    // Calls: role, item verify, group verify, insert (onConflict)
    const db = {
      select: makeSelectDb(
        [{ role: "owner" }], // requireManagerRole
        [{ id: "item-1" }], // menuItem ownership check
        [{ id: "group-1" }], // modifierGroup ownership check
      ).select,
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: () => Promise.resolve([mockLink]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.assignToItem({
      menuItemId: "item-1",
      modifierGroupId: "group-1",
      sortOrder: 0,
    });

    expect(result.menuItemId).toBe("item-1");
    expect(result.modifierGroupId).toBe("group-1");
  });

  test("throws NOT_FOUND when menu item does not belong to org", async () => {
    const db = {
      select: makeSelectDb(
        [{ role: "owner" }],
        [], // menuItem lookup → empty
      ).select,
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.assignToItem({
        menuItemId: "ghost",
        modifierGroupId: "group-1",
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("throws NOT_FOUND when modifier group does not belong to org", async () => {
    const db = {
      select: makeSelectDb(
        [{ role: "owner" }],
        [{ id: "item-1" }],
        [], // modifierGroup lookup → empty
      ).select,
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.assignToItem({
        menuItemId: "item-1",
        modifierGroupId: "ghost",
        sortOrder: 0,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("modifier.unassignFromItem", () => {
  test("removes the assignment link", async () => {
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve([mockLink]),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    const result = await caller.unassignFromItem({
      menuItemId: "item-1",
      modifierGroupId: "group-1",
    });

    expect(result.menuItemId).toBe("item-1");
  });

  test("throws NOT_FOUND when assignment does not exist", async () => {
    const db = {
      select: makeSelectDb([{ role: "owner" }]).select,
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await expect(
      caller.unassignFromItem({
        menuItemId: "item-1",
        modifierGroupId: "group-1",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

// ─── Org isolation ────────────────────────────────────────────────────────────

describe("Org isolation", () => {
  test("list uses activeOrganizationId to scope query — no fallback DB call needed", async () => {
    // With activeOrganizationId set, list makes exactly 2 selects (groups, options)
    // If it silently used the wrong org, the mock would still return data —
    // the important thing is that getOrganizationId skips the member lookup.
    let selectCount = 0;
    const db = {
      select: () => {
        selectCount++;
        return {
          from: () => ({
            where: () => ({
              orderBy: () => Promise.resolve([]),
            }),
          }),
        };
      },
    };
    const caller = modifierRouter.createCaller(makeCtx("org-123", db));
    await caller.list({});
    // With activeOrganizationId, no extra member select for getOrganizationId
    expect(selectCount).toBe(2); // groups + options only
  });

  test("list falls back to member lookup when session has no activeOrganizationId", async () => {
    let selectCount = 0;
    const db = {
      select: () => {
        selectCount++;
        return {
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([{ organizationId: "org-123" }]),
              orderBy: () => Promise.resolve([]),
            }),
          }),
        };
      },
    };
    const caller = modifierRouter.createCaller(makeCtx(null, db));
    await caller.list({});
    // member lookup + groups + options = 3 selects
    expect(selectCount).toBe(3);
  });

  test("throws BAD_REQUEST when session has no org and user has no memberships", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
            orderBy: () => Promise.resolve([]),
          }),
        }),
      }),
    };
    const caller = modifierRouter.createCaller(makeCtx(null, db));
    await expect(caller.list({})).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
