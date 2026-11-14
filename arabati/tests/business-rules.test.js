import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed.js";
import { applyAction, checkPassword } from "../src/services/repository.js";
import {
  dateAt,
  DEMO_PASSWORD,
  eventStart,
  eventEnd,
  isFuture,
  isPublic,
  localDate,
  ratingFor,
  searchCarts,
  unavailable,
  validateAccount,
  validateBooking,
  validateListing,
  validMobile,
} from "../src/domain/rules.js";
const NOW = new Date("2026-11-14T09:00:00+03:00");
const fresh = () => createSeed(NOW);
const action = (s, user, type, payload) =>
  applyAction(s, user, type, payload, NOW);
const request = (extra = {}) => ({
  cartId: "roast",
  packageId: "roast-standard",
  date: dateAt(15, NOW),
  time: "18:00",
  city: "Al Khobar",
  venue: "Al Khobar event hall",
  guests: 60,
  duration: 3,
  budget: 1500,
  terms: true,
  notes: "Power is available.",
  ...extra,
});

test("Riyadh local date and future validation reject today and invalid calendar dates", () => {
  assert.equal(localDate(new Date("2026-11-13T22:30:00Z")), "2026-11-14");
  assert.equal(isFuture("2026-11-14", NOW), false);
  assert.equal(isFuture("2026-11-15", NOW), true);
  assert.equal(isFuture("2026-11-31", NOW), false);
  assert.equal(isFuture("2026-99-01", NOW), false);
});
test("guest discovery exposes only active approved unsuspended listings", () => {
  const s = fresh();
  assert.equal(searchCarts(s).length, 6);
  s.carts[0].suspended = true;
  assert.equal(searchCarts(s).length, 5);
  s.users.find((u) => u.id === "vendor-2").status = "Suspended";
  assert.equal(searchCarts(s).length, 4);
});
test("city, category, budget and availability filters compose", () => {
  const s = fresh();
  const results = searchCarts(s, {
    city: "Al Khobar",
    category: "Coffee",
    budget: 1250,
    date: dateAt(8, NOW),
  });
  assert.deepEqual(
    results.map((c) => c.id),
    ["matcha"],
  );
  assert.equal(searchCarts(s, { budget: 1 }).length, 0);
});
test("pending requests do not reserve dates", () => {
  const s = fresh();
  assert.equal(unavailable(s, "roast", dateAt(6, NOW)), false);
  assert.equal(unavailable(s, "roast", dateAt(12, NOW)), true);
});
test("registration validates Saudi mobile, uniqueness, password, terms and public roles", () => {
  assert.equal(validMobile("0500000000"), true);
  assert.equal(validMobile("+966500000000"), true);
  assert.equal(validMobile("555"), false);
  const errs = validateAccount(
    {
      name: "A",
      email: "CUSTOMER@arabati.demo",
      mobile: "123",
      password: "short",
      role: "admin",
      terms: false,
    },
    fresh().users,
  );
  assert.deepEqual(Object.keys(errs).sort(), [
    "email",
    "mobile",
    "name",
    "password",
    "role",
    "terms",
  ]);
});
test("valid request stores Pending with immutable package snapshot, reference and alerts", async () => {
  const s = fresh();
  const out = await action(s, "customer-demo", "requestBooking", request());
  const b = out.state.bookings.find((v) => v.id === out.result);
  assert.equal(b.status, "Pending");
  assert.equal(b.history.length, 1);
  assert.equal(b.package.price, 1200);
  assert.equal(out.state.notifications.length, s.notifications.length + 2);
  assert.equal(s.bookings.length, 7);
});
test("booking validation rejects over-capacity guests, insufficient budget and excessive duration", () => {
  const s = fresh(),
    cart = s.carts[0],
    actor = s.users[0];
  const errs = validateBooking(
    s,
    actor,
    cart,
    cart.packages[0],
    request({ guests: 101, budget: 100, duration: 4, terms: false }),
    NOW,
  );
  assert.ok(errs.guests && errs.budget && errs.duration && errs.terms);
});
test("non-customer cannot create a booking", async () => {
  await assert.rejects(
    action(fresh(), "vendor-demo", "requestBooking", request()),
    /customer/,
  );
  await assert.rejects(
    action(fresh(), null, "requestBooking", request()),
    /account/,
  );
});
test("duplicate request is rejected without creating a second booking", async () => {
  const first = await action(
    fresh(),
    "customer-demo",
    "requestBooking",
    request(),
  );
  await assert.rejects(
    action(first.state, "customer-demo", "requestBooking", request()),
    (e) => !!e.fields.date,
  );
});
test("blocked and accepted dates reject requests", async () => {
  for (const offset of [8, 12])
    await assert.rejects(
      action(
        fresh(),
        "customer-demo",
        "requestBooking",
        request({ date: dateAt(offset, NOW) }),
      ),
      (e) => !!e.fields.date,
    );
});
test("acceptance reserves the date and declines competing pending requests", async () => {
  const s = fresh(),
    copy = {
      ...structuredClone(s.bookings[0]),
      id: "ARB-competitor",
      customerId: "customer-guest",
    };
  s.bookings.push(copy);
  const out = await action(s, "vendor-demo", "decideBooking", {
    bookingId: "ARB-1042",
    status: "Accepted",
    note: "Welcome!",
  });
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1042").status,
    "Accepted",
  );
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-competitor").status,
    "Declined",
  );
  assert.equal(unavailable(out.state, "roast", dateAt(6, NOW)), true);
});
test("twenty competing decisions produce exactly one accepted event in serialized state", async () => {
  let s = fresh();
  s.bookings = s.bookings.filter(
    (b) => b.cartId !== "roast" || b.date !== dateAt(6, NOW),
  );
  for (let i = 0; i < 20; i++)
    s.bookings.push({
      ...structuredClone(fresh().bookings[0]),
      id: `race-${i}`,
      customerId: `race-user-${i}`,
    });
  let accepted = 0;
  for (let i = 0; i < 20; i++) {
    try {
      const out = await action(s, "vendor-demo", "decideBooking", {
        bookingId: `race-${i}`,
        status: "Accepted",
      });
      s = out.state;
      accepted++;
    } catch {
      /* stale decisions must fail */
    }
  }
  assert.equal(accepted, 1);
  assert.equal(
    s.bookings.filter(
      (b) =>
        b.cartId === "roast" &&
        b.date === dateAt(6, NOW) &&
        b.status === "Accepted",
    ).length,
    1,
  );
});
test("customer, administrator and other vendor cannot decide a vendor booking", async () => {
  for (const actor of ["customer-demo", "admin-demo", "vendor-2"])
    await assert.rejects(
      action(fresh(), actor, "decideBooking", {
        bookingId: "ARB-1042",
        status: "Accepted",
      }),
    );
});
test("cancellation requires ownership, reason and future eligible state, then releases reservation", async () => {
  const s = fresh();
  await assert.rejects(
    action(s, "customer-demo", "cancelBooking", {
      bookingId: "ARB-1030",
      reason: "",
    }),
  );
  await assert.rejects(
    action(s, "customer-guest", "cancelBooking", {
      bookingId: "ARB-1030",
      reason: "Changed plans",
    }),
  );
  await assert.rejects(
    action(s, "customer-demo", "cancelBooking", {
      bookingId: "ARB-1020",
      reason: "Too late",
    }),
  );
  const out = await action(s, "customer-demo", "cancelBooking", {
    bookingId: "ARB-1030",
    reason: "Event postponed",
  });
  assert.equal(unavailable(out.state, "roast", dateAt(12, NOW)), false);
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1030").history.at(-1).status,
    "Cancelled",
  );
});
test("completion is available only to the owning vendor after event end", async () => {
  await assert.rejects(
    action(fresh(), "vendor-demo", "completeBooking", {
      bookingId: "ARB-1030",
    }),
  );
  await assert.rejects(
    action(fresh(), "customer-demo", "completeBooking", {
      bookingId: "ARB-1020",
    }),
  );
  const out = await action(fresh(), "vendor-demo", "completeBooking", {
    bookingId: "ARB-1020",
  });
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1020").status,
    "Completed",
  );
});
test("verified review needs completed ownership, valid rating/text and is unique", async () => {
  await assert.rejects(
    action(fresh(), "customer-demo", "review", {
      bookingId: "ARB-1042",
      rating: 5,
      text: "Such a lovely event.",
    }),
  );
  await assert.rejects(
    action(fresh(), "customer-guest", "review", {
      bookingId: "ARB-0931",
      rating: 5,
      text: "Such a lovely event.",
    }),
  );
  await assert.rejects(
    action(fresh(), "customer-demo", "review", {
      bookingId: "ARB-0931",
      rating: 0,
      text: "Great",
    }),
  );
  const out = await action(fresh(), "customer-demo", "review", {
    bookingId: "ARB-0931",
    rating: 5,
    text: "Such a lovely event and friendly team.",
  });
  assert.equal(ratingFor(out.state, "roast").count, 3);
  await assert.rejects(
    action(out.state, "customer-demo", "review", {
      bookingId: "ARB-0931",
      rating: 4,
      text: "A second review should fail.",
    }),
  );
});
test("calendar blocks decline affected pending requests and can be removed", async () => {
  let out = await action(fresh(), "vendor-demo", "blockDate", {
    date: dateAt(6, NOW),
  });
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1042").status,
    "Declined",
  );
  assert.ok(out.state.carts[0].blockedDates.includes(dateAt(6, NOW)));
  out = await action(out.state, "vendor-demo", "blockDate", {
    date: dateAt(6, NOW),
  });
  assert.equal(out.state.carts[0].blockedDates.includes(dateAt(6, NOW)), false);
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1042").status,
    "Declined",
  );
});
test("past and accepted booking dates cannot be blocked", async () => {
  for (const date of [dateAt(-1, NOW), dateAt(12, NOW)])
    await assert.rejects(action(fresh(), "vendor-demo", "blockDate", { date }));
});
test("package edits preserve snapshots on earlier requests", async () => {
  const s = fresh(),
    cart = structuredClone(s.carts[0]);
  cart.packages[0].price = 9999;
  const out = await action(s, "vendor-demo", "saveListing", { cart });
  assert.equal(out.state.carts[0].packages[0].price, 9999);
  assert.equal(
    out.state.bookings.find((b) => b.id === "ARB-1042").package.price,
    1200,
  );
});
test("listing validation requires cities, valid menu and positive finite package values", () => {
  const cart = structuredClone(fresh().carts[0]);
  cart.cities = [];
  cart.packages[0].price = Infinity;
  cart.menu[0].price = -1;
  const errs = validateListing(cart);
  assert.ok(errs.cities && errs.baseCity && errs.packages && errs.menu);
});
test("vendor draft submission stays pending and hidden until verification", async () => {
  const s = fresh(),
    cart = s.carts.find((c) => c.id === "saj");
  const out = await action(s, "vendor-8", "saveListing", {
    cart,
    submit: true,
  });
  assert.equal(out.state.carts.find((c) => c.id === "saj").status, "Pending");
  assert.equal(
    isPublic(
      out.state,
      out.state.carts.find((c) => c.id === "saj"),
    ),
    false,
  );
});
test("verification requires admin, pending state, checks or a rejection reason", async () => {
  await assert.rejects(
    action(fresh(), "vendor-demo", "verifyListing", {
      cartId: "palm",
      status: "Approved",
      checks: [true, true, true],
    }),
  );
  await assert.rejects(
    action(fresh(), "admin-demo", "verifyListing", {
      cartId: "palm",
      status: "Approved",
      checks: [true, false, true],
    }),
  );
  await assert.rejects(
    action(fresh(), "admin-demo", "verifyListing", {
      cartId: "palm",
      status: "Rejected",
      reason: "",
    }),
  );
  const out = await action(fresh(), "admin-demo", "verifyListing", {
    cartId: "palm",
    status: "Approved",
    checks: [true, true, true],
  });
  assert.equal(
    isPublic(
      out.state,
      out.state.carts.find((c) => c.id === "palm"),
    ),
    true,
  );
  assert.equal(out.state.audit.length, 1);
});
test("suspension hides a listing, preserves existing bookings and restore does not bypass approval", async () => {
  const s = fresh();
  let out = await action(s, "admin-demo", "moderate", {
    targetType: "listing",
    targetId: "roast",
    action: "suspend",
    reason: "Reviewing prices",
  });
  assert.equal(isPublic(out.state, out.state.carts[0]), false);
  assert.deepEqual(out.state.bookings, s.bookings);
  out = await action(out.state, "admin-demo", "moderate", {
    targetType: "listing",
    targetId: "palm",
    action: "suspend",
    reason: "Temporary review",
  });
  out = await action(out.state, "admin-demo", "moderate", {
    targetType: "listing",
    targetId: "palm",
    action: "restore",
    reason: "Review complete",
  });
  assert.equal(out.state.carts.find((c) => c.id === "palm").status, "Pending");
  assert.equal(
    isPublic(
      out.state,
      out.state.carts.find((c) => c.id === "palm"),
    ),
    false,
  );
});
test("moderation requires a reason and protects the current administrator", async () => {
  await assert.rejects(
    action(fresh(), "admin-demo", "moderate", {
      targetType: "user",
      targetId: "admin-demo",
      action: "suspend",
      reason: "Testing",
    }),
  );
  await assert.rejects(
    action(fresh(), "admin-demo", "moderate", {
      targetType: "listing",
      targetId: "roast",
      action: "suspend",
      reason: "",
    }),
  );
});
test("report validation preserves private evidence and blocks duplicate open reports", async () => {
  await assert.rejects(
    action(fresh(), "customer-demo", "report", {
      cartId: "roast",
      targetType: "listing",
      reason: "Other",
      details: "Too short",
    }),
  );
  const payload = {
    cartId: "roast",
    targetType: "listing",
    reason: "Misleading information",
    details:
      "The package description seems unclear. Please verify the listed capacity.",
  };
  const out = await action(fresh(), "customer-demo", "report", payload);
  assert.ok(out.state.reports[0].targetSnapshot);
  assert.equal(out.state.reports[0].reporterId, "customer-demo");
  await assert.rejects(action(out.state, "customer-demo", "report", payload));
});
test("hide-and-resolve updates public average/count and saves audit reason and actor", async () => {
  const s = fresh();
  assert.equal(ratingFor(s, "roast").average, "4.5");
  const out = await action(s, "admin-demo", "resolveReport", {
    reportId: "R-204",
    action: "hide",
    reason: "The evidence confirms this content belongs to another event.",
  });
  assert.deepEqual(ratingFor(out.state, "roast"), { count: 1, average: "5.0" });
  assert.equal(out.state.reports[0].status, "Resolved");
  assert.equal(out.state.audit[0].actorId, "admin-demo");
  assert.ok(out.state.audit[0].reason);
  await assert.rejects(
    action(out.state, "admin-demo", "resolveReport", {
      reportId: "R-204",
      action: "dismiss",
      reason: "Try twice",
    }),
  );
});
test("notification read action affects only the signed-in account", async () => {
  const out = await action(fresh(), "customer-demo", "readNotifications", {});
  assert.equal(out.state.notifications.find((n) => n.id === "N-1").read, true);
  assert.equal(out.state.notifications.find((n) => n.id === "N-2").read, false);
});
test("administrator booking oversight cannot change participant statuses", async () => {
  for (const type of ["decideBooking", "cancelBooking", "completeBooking"])
    await assert.rejects(
      action(fresh(), "admin-demo", type, {
        bookingId: "ARB-1042",
        status: "Accepted",
        reason: "No",
        note: "No",
      }),
    );
});
test("wrong credentials show a generic error and fifth failure rate-limits retry", async () => {
  let s = fresh();
  for (let i = 0; i < 5; i++) {
    const out = await action(s, null, "signIn", {
      email: "customer@arabati.demo",
      password: "wrong",
    });
    assert.ok(out.authenticationError);
    s = out.state;
  }
  await assert.rejects(
    action(s, null, "signIn", {
      email: "customer@arabati.demo",
      password: DEMO_PASSWORD,
    }),
    /15 minutes/,
  );
});
test("customer registration stores a derived credential and never plaintext", async () => {
  const out = await action(fresh(), null, "register", {
    name: "Test Customer",
    email: "new@example.com",
    mobile: "0501234567",
    password: "ASamplePassword123",
    role: "customer",
    terms: true,
  });
  const user = out.state.users.find((u) => u.id === out.result);
  assert.equal(user.password, undefined);
  assert.ok(user.passwordHash && user.passwordSalt);
  assert.equal(await checkPassword(user, "ASamplePassword123"), true);
});
test("password reset is generic, expires after 30 minutes, single-use and invalidates sessions", async () => {
  let out = await action(fresh(), null, "requestReset", {
    email: "customer@arabati.demo",
  });
  const token = out.result;
  await assert.rejects(
    applyAction(
      out.state,
      null,
      "resetPassword",
      { token, password: "NewPassword12345", confirm: "NewPassword12345" },
      new Date(NOW.getTime() + 1800001),
    ),
    /expired/,
  );
  out = await action(out.state, null, "resetPassword", {
    token,
    password: "NewPassword12345",
    confirm: "NewPassword12345",
  });
  assert.equal(out.state.users[0].sessionVersion, 1);
  assert.equal(
    await checkPassword(out.state.users[0], "NewPassword12345"),
    true,
  );
  await assert.rejects(
    action(out.state, null, "resetPassword", {
      token,
      password: "NewPassword12345",
      confirm: "NewPassword12345",
    }),
  );
  const unknown = await action(out.state, null, "requestReset", {
    email: "unknown@example.com",
  });
  assert.ok(unknown.result);
});
test("profile changes validate mobile, and password change checks the current password", async () => {
  await assert.rejects(
    action(fresh(), "customer-demo", "saveProfile", {
      name: "Test",
      mobile: "123",
    }),
  );
  await assert.rejects(
    action(fresh(), "customer-demo", "changePassword", {
      current: "wrong",
      password: "NewPassword12345",
      confirm: "NewPassword12345",
    }),
  );
  const out = await action(fresh(), "customer-demo", "changePassword", {
    current: DEMO_PASSWORD,
    password: "NewPassword12345",
    confirm: "NewPassword12345",
  });
  assert.equal(out.state.users[0].sessionVersion, 1);
});
