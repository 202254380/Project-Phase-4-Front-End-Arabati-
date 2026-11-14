import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  Badge,
  Button,
  Check,
  Empty,
  Field,
  FormAlert,
  Link,
  Modal,
  Notice,
  PageHeading,
  Tabs,
  navigate,
  useAction,
  Pagination,
} from "../components/UI.jsx";
import { CartArt } from "../components/CartArt.jsx";
import { Icon } from "../components/Icons.jsx";
import {
  dateAt,
  eventStart,
  eventEnd,
  isPublic,
  localDate,
  money,
  prettyDate,
  prettyTime,
  STATUSES,
} from "../domain/rules.js";

export function BookingCard({ booking, cart, to, customerName }) {
  return (
    <Link to={to || `/booking/${booking.id}`} className="booking-card">
      <div className="booking-card-art">
        <CartArt
          theme={cart?.theme}
          name={booking.cartName}
          category={cart?.category}
        />
      </div>
      <div className="booking-card-info">
        <div className="card-meta">
          <span className="small muted">{booking.id}</span>
          <Badge status={booking.status} />
        </div>
        <h3>{booking.cartName}</h3>
        <p>
          <Icon name="calendar" size={15} />
          {prettyDate(booking.date, true)} · {booking.time}
        </p>
        <span className="small muted">
          {customerName || booking.package.name} · {booking.guests} guests
        </span>
      </div>
      <div className="booking-card-end">
        <strong>{money(booking.package.price)}</strong>
        <span>
          View details
          <Icon name="arrow" size={16} />
        </span>
      </div>
    </Link>
  );
}

export function BookingList() {
  const { state, user } = useApp();
  const [tab, setTab] = useState("Upcoming"),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);

  const all = state.bookings.filter((b) => b.customerId === user.id),
    now = Date.now();

  const records = all
    .filter(
      (b) =>
        (!status || b.status === status) &&
        (tab === "All" ||
          (tab === "Upcoming"
            ? ["Pending", "Accepted"].includes(b.status) && eventEnd(b) >= now
            : !["Pending", "Accepted"].includes(b.status) ||
              eventEnd(b) < now)),
    )
    .sort((a, b) =>
      tab === "Upcoming"
        ? eventStart(a) - eventStart(b)
        : eventStart(b) - eventStart(a),
    );

  return (
    <>
      <PageHeading
        eyebrow="MAKE ROOM FOR GOOD MOMENTS"
        title="My bookings"
        action={
          <Link to="/" className="button primary">
            Find another cart
            <Icon name="plus" size={17} />
          </Link>
        }
      >
        Your plans, from first request to the last happy guest.
      </PageHeading>

      <div className="results-toolbar">
        <Tabs
          items={["Upcoming", "Past", "All"]}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          label="Booking period"
        />
        <select
          aria-label="Filter bookings by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="record-count">
        {records.length} {records.length === 1 ? "booking" : "bookings"}
      </div>

      {records.length ? (
        <>
          <div className="booking-list">
            {records.slice((page - 1) * 20, page * 20).map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                cart={state.carts.find((c) => c.id === b.cartId)}
              />
            ))}
          </div>
          <Pagination total={records.length} page={page} onChange={setPage} />
        </>
      ) : (
        <Empty
          icon="calendar"
          title="Your next good memory starts here"
          action={
            <Link to="/" className="button primary">
              Discover carts
              <Icon name="arrow" size={17} />
            </Link>
          }
        >
          No bookings match this view. Find a cart and send your first request.
        </Empty>
      )}
    </>
  );
}

export function RequestBooking({ id, query }) {
  const { state, run, flash } = useApp();
  const cart = state.carts.find((c) => c.id === id),
    pkg =
      cart?.packages.find((p) => p.id === query.get("package")) ||
      cart?.packages[0];

  const [values, setValues] = useState(() => ({
      date: query.get("date") || dateAt(6),
      time: "18:00",
      city: cart?.cities[0] || "Al Khobar",
      venue: "",
      guests: "60",
      duration: String(pkg?.duration || 3),
      budget: String(pkg?.price || 0),
      notes: "",
      terms: false,
    })),
    action = useAction();

  const update = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  if (!cart || !pkg)
    return (
      <Empty
        title="This package is no longer available"
        action={
          <Link to="/" className="button primary">
            Find a cart
          </Link>
        }
      >
        Select a new package to continue.
      </Empty>
    );

  return (
    <>
      <PageHeading
        back={`/cart/${id}`}
        eyebrow="THE DETAILS MAKE IT YOURS"
        title="Let’s plan your gathering."
      >
        A few details help your vendor prepare something special.
      </PageHeading>

      <div className="form-aside-layout">
        <form
          className="panel booking-form stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            action.execute(async () => {
              const bookingId = await run("requestBooking", {
                ...values,
                cartId: id,
                packageId: pkg.id,
              });
              flash("Your booking request is on its way.");
              navigate(`/confirmation/${bookingId}`);
            });
          }}
        >
          <FormAlert error={action.error} />
          <h2>Your event details</h2>

          <div className="form-grid">
            <Field label="Event date" required error={action.fields.date}>
              <input
                type="date"
                min={dateAt(1)}
                value={values.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </Field>

            <Field
              label="Start time"
              required
              hint="Saudi Arabia time (UTC+3)"
              error={action.fields.time}
            >
              <input
                type="time"
                value={values.time}
                onChange={(e) => update("time", e.target.value)}
              />
            </Field>

            <Field label="City" required error={action.fields.city}>
              <select
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
              >
                {cart.cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Number of guests"
              required
              hint={`Up to ${pkg.capacity} guests`}
              error={action.fields.guests}
            >
              <input
                type="number"
                min="1"
                max={pkg.capacity}
                step="1"
                value={values.guests}
                onChange={(e) => update("guests", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Venue or address" required error={action.fields.venue}>
            <input
              value={values.venue}
              maxLength={250}
              onChange={(e) => update("venue", e.target.value)}
              placeholder="Event hall, street and neighbourhood"
              autoComplete="street-address"
            />
          </Field>

          <div className="form-grid">
            <Field
              label="Service duration in hours"
              required
              hint={`Up to ${pkg.duration} hours included`}
              error={action.fields.duration}
            >
              <input
                type="number"
                min="0.5"
                max={pkg.duration}
                step="0.5"
                value={values.duration}
                onChange={(e) => update("duration", e.target.value)}
              />
            </Field>

            <Field
              label="Budget in SAR"
              required
              hint={`Package total: ${money(pkg.price)}`}
              error={action.fields.budget}
            >
              <input
                type="number"
                min={pkg.price}
                value={values.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Anything else we should know?"
            hint="Optional · Power access, setup instructions or special requests"
            error={action.fields.notes}
          >
            <textarea
              rows="4"
              maxLength={1000}
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="A little context goes a long way…"
            />
          </Field>

          <Check
            checked={values.terms}
            onChange={(e) => update("terms", e.target.checked)}
            error={action.fields.terms}
          >
            I confirm these details and understand that my request is confirmed
            only after the vendor accepts. No online payment is collected.
          </Check>

          <Button
            type="submit"
            busy={action.busy}
            disabled={!isPublic(state, cart)}
          >
            Send booking request
            <Icon name="arrow" size={17} />
          </Button>

          <p className="muted small">
            Pending requests do not reserve a date. We recheck availability when
            you submit.
          </p>
        </form>

        <aside className="panel order-summary">
          <CartArt {...cart} />
          <span className="verified">
            <Icon name="verified" size={16} />
            Verified cart
          </span>
          <h2>{cart.name}</h2>
          <p className="muted">{pkg.name}</p>
          <dl>
            <div>
              <dt>Guest capacity</dt>
              <dd>{pkg.capacity} guests</dd>
            </div>
            <div>
              <dt>Included service</dt>
              <dd>{pkg.duration} hours</dd>
            </div>
            <div>
              <dt>Your event date</dt>
              <dd>{prettyDate(values.date, true)}</dd>
            </div>
            <div className="total">
              <dt>Package total</dt>
              <dd>{money(pkg.price)}</dd>
            </div>
          </dl>
          <Notice icon="heart">
            Good things take a little planning. Your vendor will review the
            details and reply in Bookings.
          </Notice>
        </aside>
      </div>
    </>
  );
}

export function BookingConfirmation({ id }) {
  const { state, user } = useApp();
  const b = state.bookings.find((v) => v.id === id && v.customerId === user.id);

  if (!b) return <Empty title="Booking not found" />;

  return (
    <div className="confirmation panel">
      <div className="confirmation-icon">
        <Icon name="check" size={40} />
      </div>
      <p className="eyebrow">LET THE GOOD MOMENTS BEGIN</p>
      <h1>
        Your event is
        <br />
        <em>one step closer.</em>
      </h1>
      <p>
        Your request <strong>{b.id}</strong> is now <Badge status={b.status} />
      </p>
      <div className="confirmation-details">
        <h3>{b.cartName}</h3>
        <p>
          {prettyDate(b.date)} · {b.time}
        </p>
        <p>
          {b.package.name} · {money(b.package.price)}
        </p>
      </div>
      <p className="muted">
        The vendor will accept or decline your request.
        <br />
        Follow every update in Bookings and Alerts.
      </p>
      <Link to={`/booking/${id}`} className="button primary">
        Track my request
        <Icon name="arrow" size={17} />
      </Link>
      <Link to="/" className="text-button">
        Back to Discover
      </Link>
    </div>
  );
}

export function CancellationDialog({ booking, onClose }) {
  const { run, flash } = useApp();
  const [reason, setReason] = useState(""),
    action = useAction();

  return (
    <Modal title="Cancel this booking?" onClose={onClose}>
      <p className="muted">
        {booking.id} · {booking.cartName}
      </p>
      <Notice>
        An accepted date becomes available again after cancellation. Your
        booking history is kept.
      </Notice>

      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          action.execute(async () => {
            await run("cancelBooking", { bookingId: booking.id, reason });
            flash("Booking cancelled. The date has been released.");
            onClose();
          });
        }}
      >
        <FormAlert error={action.error} />
        <Field
          label="Cancellation reason"
          required
          error={action.fields.reason}
        >
          <textarea
            value={reason}
            maxLength={1000}
            rows="4"
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the vendor know what changed…"
          />
        </Field>
        <div className="button-row">
          <Button variant="secondary" onClick={onClose}>
            Keep booking
          </Button>
          <Button type="submit" variant="danger" busy={action.busy}>
            Confirm cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ContactDialog({ booking, onClose }) {
  const { state, user } = useApp();
  const other = state.users.find(
    (u) =>
      u.id === (user.role === "vendor" ? booking.customerId : booking.vendorId),
  );
  const phone = (other?.mobile || "").replace(/\D/g, "").replace(/^0/, "966");
  const text = `Hello, about booking ${booking.id} with ${booking.cartName} on ${prettyDate(booking.date)} at ${booking.time}.`;

  return (
    <Modal title="A little hello before the event" onClose={onClose}>
      <Notice>
        Demo contact details are fictional. WhatsApp opens a draft that you
        review and send yourself.
      </Notice>
      <div className="contact-preview">
        <span className="small muted">MESSAGE PREVIEW</span>
        <p>{text}</p>
      </div>
      <p className="muted small">
        Contact: {other?.name || "Event customer"} ·{" "}
        {other?.mobile || "Unavailable"}
      </p>
      {phone ? (
        <a
          className="button primary full-width"
          href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open WhatsApp draft
          <Icon name="external" size={17} />
        </a>
      ) : (
        <Notice>The contact number is unavailable in this example.</Notice>
      )}
    </Modal>
  );
}

export function BookingDetail({ id, admin = false }) {
  const { state, user } = useApp();
  const [cancel, setCancel] = useState(false),
    [contact, setContact] = useState(false);

  const b = state.bookings.find(
    (v) =>
      v.id === id && (admin ? user.role === "admin" : v.customerId === user.id),
  );

  if (!b)
    return (
      <Empty
        title="This booking isn’t available"
        action={
          <Link
            to={admin ? "/records" : "/bookings"}
            className="button primary"
          >
            Back to bookings
          </Link>
        }
      >
        You can only open records available to your account.
      </Empty>
    );

  const cart = state.carts.find((c) => c.id === b.cartId),
    review = state.reviews.find((r) => r.bookingId === id),
    eligible =
      ["Pending", "Accepted"].includes(b.status) && eventStart(b) > Date.now();

  return (
    <>
      <PageHeading
        back={admin ? "/records" : "/bookings"}
        eyebrow={
          admin
            ? "READ ONLY BOOKING OVERSIGHT"
            : "YOUR GATHERING, ALL IN ONE PLACE"
        }
        title={`Booking ${b.id}`}
        action={<Badge status={b.status} />}
      >
        {b.cartName} · {prettyDate(b.date)}
      </PageHeading>

      {admin && (
        <Notice>
          Administrator oversight is read only. Participant status changes and
          contact actions are unavailable.
        </Notice>
      )}

      <div className="form-aside-layout">
        <div className="stack">
          <section className="panel event-detail">
            <div className="event-detail-top">
              <div>
                <span className="verified">
                  <Icon name="verified" size={16} />
                  Your event cart
                </span>
                <h2>{b.cartName}</h2>
                <p className="muted">{b.package.name}</p>
              </div>
              <div className="event-thumb">
                <CartArt {...cart} />
              </div>
            </div>

            <dl className="event-facts">
              <div>
                <dt>
                  <Icon name="calendar" size={17} />
                  Date & time
                </dt>
                <dd>
                  {prettyDate(b.date)}
                  <small>
                    {b.time} · {b.duration} hours · Saudi Arabia time
                  </small>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="pin" size={17} />
                  Venue
                </dt>
                <dd>
                  {b.venue}
                  <small>{b.city}</small>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="users" size={17} />
                  Your guests
                </dt>
                <dd>
                  {b.guests} guests
                  <small>Package capacity: {b.package.capacity}</small>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="cart" size={17} />
                  Package total
                </dt>
                <dd>
                  {money(b.package.price)}
                  <small>Your budget: {money(b.budget)}</small>
                </dd>
              </div>
            </dl>

            {b.notes && (
              <div className="setup-notes">
                <span className="small muted">SETUP NOTES</span>
                <p>{b.notes}</p>
              </div>
            )}

            <p className="small muted">
              Package details above are saved with your request and remain
              unchanged if the listing is edited.
            </p>
          </section>

          <section className="panel">
            <h2>Booking timeline</h2>
            <ol className="timeline">
              {b.history.map((h, i) => (
                <li key={i}>
                  <span
                    className={`timeline-dot ${i === b.history.length - 1 ? "latest" : ""}`}
                  />
                  <div>
                    <strong>
                      {h.status === "Pending"
                        ? "Request submitted"
                        : h.status === "Accepted"
                          ? "Vendor accepted"
                          : h.status === "Completed"
                            ? "Event completed"
                            : `Booking ${h.status.toLowerCase()}`}
                    </strong>
                    <time>{prettyTime(h.at)}</time>
                    <p>{h.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="panel booking-actions">
          <h2>A plan taking shape.</h2>
          <p className="muted">
            {b.status === "Pending"
              ? "Your vendor is reviewing the details. We’ll keep your updates together here."
              : b.status === "Accepted"
                ? "You’re booked. Get in touch with the vendor to talk through the details."
                : b.status === "Completed"
                  ? "Thank you for celebrating with us. Share a little of your experience."
                  : "Every update stays here, so your plans are always easy to follow."}
          </p>

          {!admin && (
            <div className="stack">
              {["Accepted", "Completed"].includes(b.status) && (
                <Button
                  variant="secondary"
                  icon="message"
                  onClick={() => setContact(true)}
                >
                  Contact vendor
                </Button>
              )}

              {b.status === "Completed" && !review && (
                <Link className="button primary" to={`/review/${b.id}`}>
                  Write a verified review
                  <Icon name="star" size={17} />
                </Link>
              )}

              {review && (
                <Notice tone="success" icon="check">
                  Your review has been submitted
                  {review.hidden
                    ? " and is currently hidden by moderation"
                    : ". Thank you!"}
                </Notice>
              )}

              {eligible && (
                <Button variant="text-danger" onClick={() => setCancel(true)}>
                  Cancel booking
                </Button>
              )}

              <Link to={`/cart/${b.cartId}`} className="text-button">
                View cart profile
                <Icon name="arrow" size={15} />
              </Link>
            </div>
          )}

          <div className="aside-footer">
            <Icon name="info" />
            <p>No online payment is collected through Arabati.</p>
          </div>
        </aside>
      </div>

      {cancel && (
        <CancellationDialog booking={b} onClose={() => setCancel(false)} />
      )}

      {contact && (
        <ContactDialog booking={b} onClose={() => setContact(false)} />
      )}
    </>
  );
}

export function ReviewBooking({ id }) {
  const { state, user, run, flash } = useApp();
  const [rating, setRating] = useState(0),
    [text, setText] = useState(""),
    action = useAction();

  const b = state.bookings.find(
    (v) => v.id === id && v.customerId === user.id && v.status === "Completed",
  );

  if (!b || state.reviews.some((r) => r.bookingId === id))
    return (
      <Empty
        icon="star"
        title="This event can’t receive another review"
        action={
          <Link to="/bookings" className="button primary">
            My bookings
          </Link>
        }
      >
        A completed event can receive one review from its customer.
      </Empty>
    );

  return (
    <div className="narrow-page">
      <PageHeading
        back={`/booking/${id}`}
        eyebrow="A LITTLE FEEDBACK GOES A LONG WAY"
        title="How was your gathering?"
      >
        {b.cartName} · {b.id} · Completed {prettyDate(b.date, true)}
      </PageHeading>

      <form
        className="panel stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          action.execute(async () => {
            await run("review", { bookingId: id, rating, text });
            flash("Your verified review is published. Thank you!");
            navigate(`/booking/${id}`);
          });
        }}
      >
        <FormAlert error={action.error} />

        <fieldset className="rating-field">
          <legend>Your overall experience *</legend>
          <div className="rating-buttons">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                aria-pressed={rating === n}
                onClick={() => setRating(n)}
              >
                <Icon
                  name="star"
                  size={36}
                  fill={n <= rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>

          {action.fields.rating && (
            <span className="error-text">{action.fields.rating}</span>
          )}
        </fieldset>

        <Field
          label="Your review"
          required
          hint={`${text.length}/1,000 characters · At least 10 characters`}
          error={action.fields.text}
        >
          <textarea
            rows="6"
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us about the cart, the service and the little details…"
          />
        </Field>

        <Notice icon="verified">
          Verified event review. One review per completed booking.
        </Notice>

        <Button type="submit" busy={action.busy}>
          Publish review
          <Icon name="arrow" size={17} />
        </Button>
      </form>
    </div>
  );
}
