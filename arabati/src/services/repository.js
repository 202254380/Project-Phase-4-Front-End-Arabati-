import { createSeed } from "../data/seed.js";
import {
  CITIES,
  DEMO_PASSWORD,
  RuleError,
  requireRule,
  validateAccount,
  validateBooking,
  validateListing,
  validMobile,
  validEmail,
  normalizeEmail,
  unavailable,
  isFuture,
  eventStart,
  eventEnd,
} from "../domain/rules.js";

export const STORE_KEY = "arabati.phase4.v1";
export const SESSION_KEY = "arabati.session.v1";
let memoryState;
export let persistenceAvailable = true;
export function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (
        saved.version === 1 &&
        [
          "users",
          "carts",
          "bookings",
          "reviews",
          "reports",
          "notifications",
          "audit",
          "resetTokens",
          "loginAttempts",
        ].every((key) => Array.isArray(saved[key]))
      )
        return saved;
    }
  } catch {
    persistenceAvailable = false;
  }
  if (!memoryState) memoryState = createSeed();
  return structuredClone(memoryState);
}
function persist(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (error) {
    if (error.name === "QuotaExceededError")
      throw new RuleError(
        "Device storage is full. Remove the uploaded photo and try again. Your previous saved data is unchanged.",
      );
    persistenceAvailable = false;
  }
  memoryState = structuredClone(state);
}
export function resetStore() {
  const state = createSeed();
  persist(state);
  sessionStorage.removeItem(SESSION_KEY);
  return state;
}
const id = (prefix, state) => `${prefix}-${++state.sequence}`;
const tokenId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function digest(password, salt) {
  requireRule(
    !!globalThis.crypto?.subtle,
    "Password features need HTTPS or localhost. Open the app using npm run dev.",
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bytes = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function checkPassword(user, password) {
  if (user?.passwordHash)
    return (await digest(password, user.passwordSalt)) === user.passwordHash;
  return !!user?.demo && password === DEMO_PASSWORD;
}
async function setPassword(user, password) {
  user.passwordSalt = tokenId();
  user.passwordHash = await digest(password, user.passwordSalt);
}
function notify(state, userId, title, body, link = {}) {
  state.notifications.unshift({
    id: id("N", state),
    userId,
    title,
    body,
    ...link,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
function audit(state, actor, action, target, reason, now) {
  state.audit.unshift({
    id: id("AUD", state),
    actorId: actor.id,
    actorName: actor.name,
    action,
    target,
    reason,
    createdAt: now.toISOString(),
  });
}
function moveBooking(state, booking, status, note, now) {
  booking.status = status;
  booking.history.push({ status, note, at: now.toISOString() });
  notify(
    state,
    booking.customerId,
    `Booking ${status.toLowerCase()}`,
    `${booking.cartName} · ${booking.id}${note ? ` · ${note}` : ""}`,
    { bookingId: booking.id },
  );
  notify(
    state,
    booking.vendorId,
    `Booking ${status.toLowerCase()}`,
    `${booking.id} · ${note || status}`,
    { bookingId: booking.id },
  );
}
const fieldsValid = (errors) =>
  requireRule(
    Object.keys(errors).length === 0,
    "Please check the highlighted fields.",
    errors,
  );
function actorFor(state, actorId, role) {
  const actor = state.users.find((u) => u.id === actorId);
  requireRule(
    actor?.status === "Active" && (!role || actor.role === role),
    "This action is not available for your account.",
  );
  return actor;
}
function ownBooking(state, actor, bookingId) {
  const booking = state.bookings.find((b) => b.id === bookingId);
  requireRule(
    booking &&
      (actor.role === "admin" ||
        (actor.role === "vendor" && booking.vendorId === actor.id) ||
        (actor.role === "customer" && booking.customerId === actor.id)),
    "This booking is not available for your account.",
  );
  return booking;
}

// Pure state boundary apart from password derivation. No request reaches a live service.
export async function applyAction(
  input,
  actorId,
  type,
  payload = {},
  now = new Date(),
) {
  const state = structuredClone(input);
  let result;
  if (type === "register") {
    fieldsValid(validateAccount(payload, state.users));
    const user = {
      id: id("U", state),
      name: payload.name.trim(),
      email: normalizeEmail(payload.email),
      mobile: payload.mobile.replace(/[\s-]/g, ""),
      role: payload.role,
      status: "Active",
      sessionVersion: 0,
    };
    await setPassword(user, payload.password);
    state.users.push(user);
    if (user.role === "vendor")
      state.carts.push({
        id: id("cart", state),
        vendorId: user.id,
        name: "",
        category: "Coffee",
        tagline: "",
        description: "",
        cities: [],
        baseCity: "Al Khobar",
        theme: "terracotta",
        status: "Draft",
        suspended: false,
        blockedDates: [],
        photo: null,
        menu: [],
        packages: [],
      });
    result = user.id;
  } else if (type === "signIn") {
    const email = normalizeEmail(payload.email || "");
    const attempts = state.loginAttempts.filter(
      (a) =>
        a.email === email && new Date(a.at).getTime() > now.getTime() - 900000,
    );
    requireRule(
      attempts.length < 5,
      "Too many attempts. Try again in 15 minutes, or reset your demo password.",
    );
    const user = state.users.find((u) => normalizeEmail(u.email) === email);
    if (
      !user ||
      user.status !== "Active" ||
      !(await checkPassword(user, payload.password))
    ) {
      state.loginAttempts.push({ email, at: now.toISOString() });
      state.revision++;
      return {
        state,
        result: null,
        authenticationError:
          "The email or password is incorrect, or this account is unavailable.",
      };
    }
    state.loginAttempts = state.loginAttempts.filter((a) => a.email !== email);
    result = user.id;
  } else if (type === "requestReset") {
    requireRule(validEmail(payload.email), "Enter a valid email address.", {
      email: "Enter a valid email address.",
    });
    const user = state.users.find(
      (u) => normalizeEmail(u.email) === normalizeEmail(payload.email),
    );
    const token = tokenId();
    state.resetTokens = state.resetTokens.filter(
      (t) => !t.used && t.expires > now.getTime(),
    );
    state.resetTokens.push({
      token,
      userId: user?.id || null,
      expires: now.getTime() + 1800000,
      used: false,
    });
    result = token;
  } else if (type === "resetPassword") {
    const token = state.resetTokens.find(
      (t) => t.token === payload.token && !t.used && t.expires > now.getTime(),
    );
    requireRule(
      token?.userId,
      "This link is invalid or expired. Please request another reset link.",
    );
    requireRule(
      payload.password?.length >= 12 && payload.password === payload.confirm,
      "Use matching passwords of at least 12 characters.",
      {
        password: "Use at least 12 characters.",
        confirm:
          payload.password !== payload.confirm
            ? "Passwords must match."
            : undefined,
      },
    );
    const user = state.users.find((u) => u.id === token.userId);
    await setPassword(user, payload.password);
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    state.resetTokens
      .filter((t) => t.userId === user.id)
      .forEach((t) => (t.used = true));
    result = user.id;
  } else {
    const actor = actorFor(state, actorId);
    if (type === "saveProfile") {
      const errors = {};
      if (payload.name?.trim().length < 2 || !payload.name?.trim())
        errors.name = "Enter a name with at least 2 characters.";
      if (!validMobile(payload.mobile))
        errors.mobile = "Use a valid Saudi mobile number.";
      fieldsValid(errors);
      actor.name = payload.name.trim();
      actor.mobile = payload.mobile.replace(/[\s-]/g, "");
      result = actor.id;
    } else if (type === "changePassword") {
      requireRule(
        await checkPassword(actor, payload.current),
        "Your current password is incorrect.",
        { current: "The current password is incorrect." },
      );
      requireRule(
        payload.password?.length >= 12 && payload.password === payload.confirm,
        "Use matching new passwords of at least 12 characters.",
        {
          password: "Use at least 12 characters.",
          confirm:
            payload.password !== payload.confirm
              ? "Passwords must match."
              : undefined,
        },
      );
      await setPassword(actor, payload.password);
      actor.sessionVersion = (actor.sessionVersion || 0) + 1;
      result = actor.id;
    } else if (type === "requestBooking") {
      const cart = state.carts.find((c) => c.id === payload.cartId),
        pkg = cart?.packages.find((p) => p.id === payload.packageId);
      requireRule(
        cart && pkg,
        "This package is no longer available. Choose another package.",
      );
      fieldsValid(validateBooking(state, actor, cart, pkg, payload, now));
      const booking = {
        id: id("ARB", state),
        customerId: actor.id,
        vendorId: cart.vendorId,
        cartId: cart.id,
        cartName: cart.name,
        status: "Pending",
        package: { ...pkg },
        date: payload.date,
        time: payload.time,
        city: payload.city,
        venue: payload.venue.trim(),
        guests: Number(payload.guests),
        duration: Number(payload.duration),
        budget: Number(payload.budget),
        notes: payload.notes?.trim() || "",
        createdAt: now.toISOString(),
        history: [
          {
            status: "Pending",
            at: now.toISOString(),
            note: "Booking request submitted.",
          },
        ],
      };
      state.bookings.unshift(booking);
      notify(
        state,
        actor.id,
        "Your request is on its way",
        `${cart.name} · ${booking.id}`,
        { bookingId: booking.id },
      );
      notify(
        state,
        cart.vendorId,
        "A new gathering is waiting",
        `${actor.name} sent booking ${booking.id}.`,
        { bookingId: booking.id },
      );
      result = booking.id;
    } else if (
      ["decideBooking", "cancelBooking", "completeBooking", "review"].includes(
        type,
      )
    ) {
      const booking = ownBooking(state, actor, payload.bookingId);
      if (type === "decideBooking") {
        requireRule(
          actor.role === "vendor" &&
            booking.vendorId === actor.id &&
            booking.status === "Pending",
          "Only the vendor can decide a pending request.",
        );
        requireRule(
          eventStart(booking) > now.getTime(),
          "This event date has passed. A new decision cannot be made.",
        );
        requireRule(
          ["Accepted", "Declined"].includes(payload.status),
          "Choose accept or decline.",
        );
        if (payload.status === "Accepted") {
          const cart = state.carts.find((c) => c.id === booking.cartId);
          requireRule(
            !cart.suspended && cart.status === "Approved",
            "This listing must be active and approved to accept new requests.",
          );
          requireRule(
            !unavailable(state, booking.cartId, booking.date, booking.id),
            "Availability changed. This date has already been reserved or blocked.",
          );
          state.bookings
            .filter(
              (b) =>
                b.id !== booking.id &&
                b.cartId === booking.cartId &&
                b.date === booking.date &&
                b.status === "Pending",
            )
            .forEach((b) =>
              moveBooking(
                state,
                b,
                "Declined",
                "The cart was reserved for another event on this date.",
                now,
              ),
            );
        }
        moveBooking(
          state,
          booking,
          payload.status,
          payload.note?.trim() ||
            `Vendor ${payload.status.toLowerCase()} the request.`,
          now,
        );
        result = booking.id;
      } else if (type === "cancelBooking") {
        requireRule(
          actor.role === "customer" &&
            booking.customerId === actor.id &&
            ["Pending", "Accepted"].includes(booking.status) &&
            eventStart(booking) > now.getTime(),
          "Only your pending or accepted future bookings can be cancelled.",
        );
        requireRule(payload.reason?.trim(), "Enter a cancellation reason.", {
          reason: "Please enter a reason.",
        });
        moveBooking(state, booking, "Cancelled", payload.reason.trim(), now);
        result = booking.id;
      } else if (type === "completeBooking") {
        requireRule(
          actor.role === "vendor" &&
            booking.vendorId === actor.id &&
            booking.status === "Accepted" &&
            eventEnd(booking) <= now.getTime(),
          "Only an accepted event that has ended can be marked completed.",
        );
        moveBooking(
          state,
          booking,
          "Completed",
          "Vendor marked the event complete. A verified review is now available.",
          now,
        );
        result = booking.id;
      } else {
        requireRule(
          actor.role === "customer" &&
            booking.customerId === actor.id &&
            booking.status === "Completed",
          "Only your completed events can be reviewed.",
        );
        requireRule(
          !state.reviews.some((r) => r.bookingId === booking.id),
          "You have already reviewed this event.",
        );
        const errors = {};
        if (
          !Number.isInteger(Number(payload.rating)) ||
          payload.rating < 1 ||
          payload.rating > 5
        )
          errors.rating = "Choose 1 to 5 stars.";
        if (
          payload.text?.trim().length < 10 ||
          payload.text?.trim().length > 1000 ||
          !payload.text?.trim()
        )
          errors.text = "Write between 10 and 1,000 characters.";
        fieldsValid(errors);
        const review = {
          id: id("REV", state),
          cartId: booking.cartId,
          bookingId: booking.id,
          customerId: actor.id,
          author: actor.name,
          rating: Number(payload.rating),
          text: payload.text.trim(),
          createdAt: now.toISOString(),
          hidden: false,
        };
        state.reviews.unshift(review);
        notify(
          state,
          actor.id,
          "Your verified review is published",
          "Thank you for sharing your experience.",
          { bookingId: booking.id },
        );
        result = review.id;
      }
    } else if (type === "saveListing") {
      requireRule(actor.role === "vendor", "Only a vendor can edit a listing.");
      const cart = state.carts.find((c) => c.vendorId === actor.id);
      requireRule(cart, "No listing found.");
      const updated = {
        ...cart,
        ...payload.cart,
        id: cart.id,
        vendorId: actor.id,
        status: cart.status,
        suspended: cart.suspended,
        blockedDates: cart.blockedDates,
      };
      requireRule(
        !updated.photo || /^data:image\/(png|jpeg);base64,/.test(updated.photo),
        "Use a JPG or PNG image.",
      );
      if (payload.submit || cart.status === "Approved")
        fieldsValid(validateListing(updated));
      else
        requireRule(
          updated.name?.trim().length >= 3,
          "Enter a cart name before saving your draft.",
          { name: "Enter at least 3 characters." },
        );
      if (payload.submit && cart.status !== "Approved") {
        updated.status = "Pending";
        updated.rejectionReason = "";
        updated.submittedAt = now.toISOString();
        state.users
          .filter((u) => u.role === "admin" && u.status === "Active")
          .forEach((u) =>
            notify(
              state,
              u.id,
              "New vendor application",
              `${updated.name} is ready for review.`,
              { cartId: cart.id },
            ),
          );
      }
      Object.assign(cart, updated);
      result = cart.id;
    } else if (type === "blockDate") {
      requireRule(
        actor.role === "vendor",
        "Only a vendor can manage availability.",
      );
      const cart = state.carts.find((c) => c.vendorId === actor.id);
      requireRule(cart, "No listing found.");
      requireRule(isFuture(payload.date, now), "Choose a future date.");
      requireRule(
        !state.bookings.some(
          (b) =>
            b.cartId === cart.id &&
            b.date === payload.date &&
            b.status === "Accepted",
        ),
        "An accepted event reserves this full date and cannot be blocked.",
      );
      if (cart.blockedDates.includes(payload.date))
        cart.blockedDates = cart.blockedDates.filter((d) => d !== payload.date);
      else {
        cart.blockedDates.push(payload.date);
        state.bookings
          .filter(
            (b) =>
              b.cartId === cart.id &&
              b.date === payload.date &&
              b.status === "Pending",
          )
          .forEach((b) =>
            moveBooking(
              state,
              b,
              "Declined",
              "The vendor blocked this date.",
              now,
            ),
          );
      }
      result = payload.date;
    } else if (type === "report") {
      const cart = state.carts.find((c) => c.id === payload.cartId);
      requireRule(cart, "This listing does not exist.");
      requireRule(
        payload.targetType === "listing" ||
          (payload.targetType === "review" &&
            state.reviews.some(
              (r) =>
                r.id === payload.targetId && r.cartId === cart.id && !r.hidden,
            )),
        "This report target is unavailable.",
      );
      const targetId =
        payload.targetType === "listing" ? cart.id : payload.targetId;
      requireRule(
        !state.reports.some(
          (r) =>
            r.reporterId === actor.id &&
            r.targetId === targetId &&
            r.targetType === payload.targetType &&
            r.status === "Open",
        ),
        "You already have an open report for this content.",
      );
      const errors = {};
      if (!payload.reason?.trim()) errors.reason = "Choose a reason.";
      if (
        !payload.details?.trim() ||
        payload.details.trim().length < 20 ||
        payload.details.trim().length > 1000
      )
        errors.details = "Write between 20 and 1,000 characters.";
      fieldsValid(errors);
      const targetSnapshot =
        payload.targetType === "review"
          ? state.reviews.find((r) => r.id === targetId)?.text
          : cart.description;
      const report = {
        id: id("R", state),
        cartId: cart.id,
        targetId,
        targetType: payload.targetType,
        targetSnapshot,
        reporterId: actor.id,
        reason: payload.reason,
        details: payload.details.trim(),
        status: "Open",
        createdAt: now.toISOString(),
      };
      state.reports.unshift(report);
      state.users
        .filter((u) => u.role === "admin")
        .forEach((u) =>
          notify(
            state,
            u.id,
            "New content report",
            `${report.id} needs review.`,
            { reportId: report.id },
          ),
        );
      result = report.id;
    } else if (type === "verifyListing") {
      requireRule(actor.role === "admin", "Administrator access required.");
      const cart = state.carts.find((c) => c.id === payload.cartId);
      requireRule(
        cart?.status === "Pending",
        "Only pending applications can be decided.",
      );
      requireRule(
        ["Approved", "Rejected"].includes(payload.status),
        "Choose approve or reject.",
      );
      requireRule(
        payload.status !== "Rejected" || payload.reason?.trim(),
        "A rejection reason is required.",
        { reason: "Explain what the vendor should change." },
      );
      if (payload.status === "Approved") {
        requireRule(
          payload.checks?.length === 3 && payload.checks.every(Boolean),
          "Complete all three verification checks.",
        );
        fieldsValid(validateListing(cart));
      }
      cart.status = payload.status;
      cart.rejectionReason =
        payload.status === "Rejected" ? payload.reason.trim() : "";
      audit(
        state,
        actor,
        `Listing ${payload.status.toLowerCase()}`,
        cart.id,
        payload.reason?.trim() ||
          "Profile, menu, packages and service cities verified.",
        now,
      );
      notify(
        state,
        cart.vendorId,
        `Your listing was ${payload.status.toLowerCase()}`,
        cart.rejectionReason || "Your cart is now visible in Discover.",
        { cartId: cart.id },
      );
      result = cart.id;
    } else if (type === "moderate") {
      requireRule(actor.role === "admin", "Administrator access required.");
      requireRule(payload.reason?.trim(), "Enter a moderation reason.", {
        reason: "A reason is required for the audit record.",
      });
      requireRule(
        ["suspend", "restore"].includes(payload.action),
        "Choose suspend or restore.",
      );
      if (payload.targetType === "user") {
        const target = state.users.find((u) => u.id === payload.targetId);
        requireRule(target, "User not found.");
        requireRule(
          target.id !== actor.id,
          "You cannot moderate your own administrator account.",
        );
        requireRule(
          !(
            payload.action === "suspend" &&
            target.role === "admin" &&
            state.users.filter(
              (u) => u.role === "admin" && u.status === "Active",
            ).length <= 1
          ),
          "The last active administrator must remain active.",
        );
        requireRule(
          target.status ===
            (payload.action === "suspend" ? "Active" : "Suspended"),
          "This account status already changed.",
        );
        target.status = payload.action === "suspend" ? "Suspended" : "Active";
        target.sessionVersion = (target.sessionVersion || 0) + 1;
        notify(
          state,
          target.id,
          `Account ${payload.action === "suspend" ? "suspended" : "restored"}`,
          payload.reason,
        );
      } else {
        const cart = state.carts.find((c) => c.id === payload.targetId);
        requireRule(cart, "Listing not found.");
        requireRule(
          cart.suspended === (payload.action === "restore"),
          "This listing status already changed.",
        );
        cart.suspended = payload.action === "suspend";
        notify(
          state,
          cart.vendorId,
          `Listing ${cart.suspended ? "suspended" : "restored"}`,
          payload.reason,
          { cartId: cart.id },
        );
      }
      audit(
        state,
        actor,
        payload.action,
        `${payload.targetType}:${payload.targetId}`,
        payload.reason.trim(),
        now,
      );
      result = payload.targetId;
    } else if (type === "resolveReport") {
      requireRule(actor.role === "admin", "Administrator access required.");
      const report = state.reports.find((r) => r.id === payload.reportId);
      requireRule(
        report?.status === "Open",
        "This report has already been resolved.",
      );
      requireRule(payload.reason?.trim(), "Enter a resolution reason.", {
        reason: "A reason is required.",
      });
      requireRule(
        ["dismiss", "hide", "suspend"].includes(payload.action),
        "Choose a valid resolution.",
      );
      if (payload.action === "hide") {
        requireRule(
          report.targetType === "review",
          "Only review reports can hide a review.",
        );
        const review = state.reviews.find((r) => r.id === report.targetId);
        requireRule(review, "The review no longer exists.");
        review.hidden = true;
      }
      if (payload.action === "suspend") {
        const cart = state.carts.find((c) => c.id === report.cartId);
        requireRule(cart, "Listing not found.");
        cart.suspended = true;
        notify(
          state,
          cart.vendorId,
          "Your listing was suspended",
          payload.reason,
          { cartId: cart.id },
        );
      }
      report.status = "Resolved";
      report.resolution = {
        action: payload.action,
        reason: payload.reason.trim(),
        actorId: actor.id,
        at: now.toISOString(),
      };
      audit(
        state,
        actor,
        `Report ${payload.action}`,
        report.id,
        payload.reason.trim(),
        now,
      );
      notify(
        state,
        report.reporterId,
        "Your report was reviewed",
        `${report.id} has been resolved. Thank you for helping the community.`,
      );
      result = report.id;
    } else if (type === "readNotifications") {
      state.notifications
        .filter(
          (n) => n.userId === actor.id && (!payload.id || n.id === payload.id),
        )
        .forEach((n) => (n.read = true));
    } else throw new RuleError("Unknown action. Please refresh and try again.");
  }
  state.revision = (state.revision || 0) + 1;
  return { state, result };
}
export async function transaction(actorId, type, payload) {
  const execute = async () => {
    const output = await applyAction(readStore(), actorId, type, payload);
    persist(output.state);
    if (output.authenticationError)
      throw new RuleError(output.authenticationError);
    return output;
  };
  if (globalThis.navigator?.locks?.request)
    return navigator.locks.request("arabati-state", execute);
  return execute();
}
