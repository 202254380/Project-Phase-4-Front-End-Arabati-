// Business rules are shared by the UI and tests. Server enforcement is a Phase 5 task.
export const CITIES = ["Al Khobar", "Dammam", "Dhahran", "Qatif", "Jubail"];
export const CATEGORIES = ["Coffee", "Food", "Desserts"];
export const STATUSES = [
  "Pending",
  "Accepted",
  "Declined",
  "Cancelled",
  "Completed",
];
export const DEMO_PASSWORD = "ArabatiDemo12!";
export const money = (value) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number(value));
export const localDate = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export function dateAt(offset, now = new Date()) {
  const date = new Date(`${localDate(now)}T12:00:00+03:00`);
  date.setUTCDate(date.getUTCDate() + offset);
  return localDate(date);
}
export const prettyDate = (value, short = false) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Riyadh",
        day: "numeric",
        month: short ? "short" : "long",
        year: short ? undefined : "numeric",
      }).format(new Date(`${value}T12:00:00+03:00`))
    : "Any date";
export const prettyTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
export const eventStart = (booking) =>
  new Date(`${booking.date}T${booking.time}:00+03:00`).getTime();
export const eventEnd = (booking) =>
  eventStart(booking) + Number(booking.duration) * 3600000;
export const isFuture = (date, now = new Date()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || date <= localDate(now))
    return false;
  const parsed = new Date(`${date}T12:00:00+03:00`);
  return !Number.isNaN(parsed.getTime()) && localDate(parsed) === date;
};
export const validMobile = (mobile) =>
  /^(05\d{8}|\+9665\d{8})$/.test((mobile || "").replace(/[\s-]/g, ""));
export const validEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
export const normalizeEmail = (email) => email.trim().toLowerCase();
export class RuleError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.fields = fields;
  }
}
export function requireRule(condition, message, fields = {}) {
  if (!condition) throw new RuleError(message, fields);
}
export function validateAccount(values, users = []) {
  const errors = {};
  if (!values.name?.trim() || values.name.trim().length < 2)
    errors.name = "Enter your full name (at least 2 characters).";
  if (!validEmail(values.email)) errors.email = "Enter a valid email address.";
  else if (
    users.some((u) => normalizeEmail(u.email) === normalizeEmail(values.email))
  )
    errors.email = "This email is already registered. Sign in instead.";
  if (!validMobile(values.mobile))
    errors.mobile = "Use 05XXXXXXXX or +9665XXXXXXXX.";
  if ((values.password || "").length < 12)
    errors.password = "Use at least 12 characters.";
  if (!["customer", "vendor"].includes(values.role))
    errors.role = "Choose Customer or Vendor.";
  if (!values.terms)
    errors.terms = "Please agree to the terms and privacy notice.";
  return errors;
}
export const isPublic = (state, cart) =>
  cart.status === "Approved" &&
  !cart.suspended &&
  state.users.some((u) => u.id === cart.vendorId && u.status === "Active");
export const unavailable = (state, cartId, date, excludeId) =>
  state.carts.find((c) => c.id === cartId)?.blockedDates.includes(date) ||
  state.bookings.some(
    (b) =>
      b.cartId === cartId &&
      b.date === date &&
      b.status === "Accepted" &&
      b.id !== excludeId,
  );
export function ratingFor(state, cartId) {
  const reviews = state.reviews.filter((r) => r.cartId === cartId && !r.hidden);
  return {
    count: reviews.length,
    average: reviews.length
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : null,
  };
}
export function searchCarts(state, filters = {}) {
  return state.carts.filter(
    (cart) =>
      isPublic(state, cart) &&
      (!filters.city || cart.cities.includes(filters.city)) &&
      (!filters.category || cart.category === filters.category) &&
      (!filters.date || !unavailable(state, cart.id, filters.date)) &&
      (!filters.budget ||
        cart.packages.some((p) => p.price <= Number(filters.budget))) &&
      (!filters.query ||
        `${cart.name} ${cart.category} ${cart.tagline}`
          .toLowerCase()
          .includes(filters.query.toLowerCase())),
  );
}
export function validateBooking(
  state,
  actor,
  cart,
  pkg,
  values,
  now = new Date(),
) {
  const errors = {};
  if (!isFuture(values.date, now))
    errors.date = "Choose a future date (from tomorrow).";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time || ""))
    errors.time = "Choose a valid start time.";
  if (!values.venue?.trim() || values.venue.trim().length < 5)
    errors.venue = "Enter a venue or street address (at least 5 characters).";
  if (!CITIES.includes(values.city) || !cart.cities.includes(values.city))
    errors.city = "Choose a city served by this cart.";
  if (
    !Number.isInteger(Number(values.guests)) ||
    values.guests < 1 ||
    values.guests > pkg.capacity
  )
    errors.guests = `Enter 1 to ${pkg.capacity} guests.`;
  if (
    !Number.isFinite(Number(values.duration)) ||
    Number(values.duration) <= 0 ||
    Number(values.duration) > pkg.duration
  )
    errors.duration = `Choose a duration greater than 0 and up to ${pkg.duration} hours.`;
  if (
    !Number.isFinite(Number(values.budget)) ||
    Number(values.budget) < pkg.price
  )
    errors.budget = `Budget must be at least ${money(pkg.price)}.`;
  if (!values.terms)
    errors.terms = "Confirm your details and the booking terms.";
  if (values.notes?.length > 1000)
    errors.notes = "Keep setup notes within 1,000 characters.";
  requireRule(
    actor?.role === "customer",
    "Please sign in as a customer to request a booking.",
  );
  requireRule(
    isPublic(state, cart),
    "This listing is not currently accepting requests. Your form is preserved.",
  );
  if (values.date && unavailable(state, cart.id, values.date))
    errors.date =
      "Availability changed. Choose another date; your details are saved.";
  if (
    state.bookings.some(
      (b) =>
        b.customerId === actor.id &&
        b.cartId === cart.id &&
        b.date === values.date &&
        ["Pending", "Accepted"].includes(b.status),
    )
  )
    errors.date =
      "You already have a pending or accepted request for this cart and date.";
  return errors;
}
export function validateListing(cart) {
  const errors = {};
  if (!cart.name?.trim() || cart.name.trim().length < 3)
    errors.name = "Enter a cart name (at least 3 characters).";
  if (!cart.description?.trim() || cart.description.trim().length < 20)
    errors.description = "Describe your service in at least 20 characters.";
  if (!CATEGORIES.includes(cart.category))
    errors.category = "Choose Coffee, Food or Desserts.";
  if (!cart.cities?.length || cart.cities.some((c) => !CITIES.includes(c)))
    errors.cities = "Choose at least one supported service city.";
  if (!cart.cities?.includes(cart.baseCity))
    errors.baseCity = "Your base city must be one of your service cities.";
  if (!cart.packages?.length) errors.packages = "Add at least one package.";
  if (
    cart.packages?.some(
      (p) =>
        !p.name?.trim() ||
        !Number.isFinite(Number(p.price)) ||
        !(p.price > 0) ||
        !Number.isInteger(Number(p.capacity)) ||
        !(p.capacity > 0) ||
        !(p.duration > 0) ||
        p.duration > 24,
    )
  )
    errors.packages =
      "Each package needs a name, positive price, whole guest capacity and a duration up to 24 hours.";
  if (
    !cart.menu?.length ||
    cart.menu.some(
      (i) =>
        !i.name?.trim() || !Number.isFinite(Number(i.price)) || !(i.price > 0),
    )
  )
    errors.menu = "Add at least one menu item with a name and positive price.";
  return errors;
}
