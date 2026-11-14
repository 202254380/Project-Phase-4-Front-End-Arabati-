import React, { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Button, Link, Modal, navigate, Notice } from "../components/UI.jsx";
import { Icon } from "../components/Icons.jsx";
export function Shell({ path, children }) {
  const { user, state, toast, setToast, reset, persistenceAvailable } =
    useApp();
  const [modal, setModal] = useState(null),
    [menu, setMenu] = useState(false);
  const unread = state.notifications.filter(
    (n) => n.userId === user?.id && !n.read,
  ).length;
  const role = user?.role || "guest";
  const links =
    role === "vendor"
      ? [
          ["/vendor", "Dashboard", "home"],
          ["/calendar", "Calendar", "calendar"],
          ["/listing", "My listing", "cart"],
        ]
      : role === "admin"
        ? [
            ["/admin", "Overview", "home"],
            ["/moderation", "Moderation", "shield"],
            ["/records", "Records", "list"],
          ]
        : [
            ["/", "Discover", "search"],
            ["/bookings", "My bookings", "calendar"],
          ];
  const allLinks = [
    ...links,
    ["/alerts", "Alerts", "bell"],
    ["/account", "Account", "user"],
  ];
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Arabati home">
            <Icon name="cart" size={30} />
            <span>
              arabati<span className="brand-dot">.</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={path === to ? "active" : ""}
                aria-current={path === to ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            <button type="button" onClick={() => setModal("how")}>
              How it works
            </button>
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  to="/alerts"
                  className="icon-button notification-button"
                  aria-label={`Notifications, ${unread} unread`}
                >
                  <Icon name="bell" />
                  {unread > 0 && <span className="notification-dot" />}
                </Link>
                <Link to="/account" className="account-pill">
                  <span className="avatar">{user.name.slice(0, 1)}</span>
                  <span>
                    {user.role === "admin"
                      ? "Administrator"
                      : user.name.split(" ")[0]}
                  </span>
                  <Icon name="down" size={14} />
                </Link>
              </>
            ) : (
              <Link to="/signin" className="button secondary compact">
                Sign in
                <Icon name="arrow" size={17} />
              </Link>
            )}
            <button
              type="button"
              className="icon-button mobile-menu-toggle"
              aria-label="Toggle menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-drawer" aria-label="Mobile navigation">
            {allLinks.map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenu(false)}>
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setModal("how");
                setMenu(false);
              }}
            >
              How it works
            </button>
          </nav>
        )}
      </header>
      {!persistenceAvailable && (
        <div className="container">
          <Notice>
            Device storage is unavailable. Changes last for this open session
            only.
          </Notice>
        </div>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className={path === "/" ? "" : "container page-main"}
      >
        {children}
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Link to="/" className="brand footer-brand">
              arabati<span className="brand-dot">.</span>
            </Link>
            <p>
              A cart for every occasion.
              <br />
              Made for gatherings in the Eastern Province.
            </p>
          </div>
          <div className="footer-links">
            <button type="button" onClick={() => setModal("how")}>
              How it works
            </button>
            <button type="button" onClick={() => setModal("terms")}>
              Terms & privacy
            </button>
            <button type="button" onClick={() => setModal("demo")}>
              Explore the demo
            </button>
          </div>
          <p className="footer-note">
            SWE 363 · Team 20 · Phase 4<br />
            <span>Interactive front-end prototype</span>
          </p>
        </div>
      </footer>
      <nav className="bottom-nav" aria-label="Quick navigation">
        {allLinks.slice(0, 5).map(([to, label, icon]) => (
          <Link
            key={to}
            to={to}
            className={path === to ? "active" : ""}
            aria-current={path === to ? "page" : undefined}
          >
            <Icon name={icon} size={21} />
            <span>{label.replace("My ", "")}</span>
          </Link>
        ))}
      </nav>
      {toast && (
        <div className={`toast ${toast.tone}`} role="status">
          <Icon name={toast.tone === "success" ? "check" : "info"} />
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
      {modal === "how" && (
        <Modal
          title="A good gathering starts here"
          onClose={() => setModal(null)}
        >
          <div className="steps">
            {[
              [
                "01",
                "Find your cart",
                "Choose your date, city and a little something you love. Compare verified carts and packages.",
              ],
              [
                "02",
                "Make it yours",
                "Tell the vendor about your event and send a booking request. No payment is collected.",
              ],
              [
                "03",
                "Bring everyone together",
                "Track the decision in Bookings. Once accepted, contact the vendor and get ready to celebrate.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <section>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </section>
              </div>
            ))}
          </div>
          <Notice>
            A request stays Pending until the vendor accepts. One accepted event
            reserves the cart for the full date.
          </Notice>
          <Button
            onClick={() => {
              setModal(null);
              navigate("/");
            }}
          >
            Find a cart
          </Button>
        </Modal>
      )}
      {modal === "terms" && (
        <Modal title="Booking terms and privacy" onClose={() => setModal(null)}>
          <div className="prose">
            <p>
              Send accurate event details. A request is confirmed only after
              vendor acceptance. Packages show their total price, maximum guests
              and included service hours in SAR.
            </p>
            <p>
              You may cancel a pending or accepted booking before the event
              starts; a reason is required. Arabati does not collect online
              payments or process refunds in this project.
            </p>
            <p>
              Only completed bookings can receive one verified review. Reports
              must explain the issue; evidence is visible to administrators.
              Contacts are shown only to accepted or completed booking
              participants.
            </p>
            <p>
              This is a front-end demonstration. Example accounts, contact
              numbers and content are fictional. Changes are saved on this
              browser; please use sample information. No email or WhatsApp
              message is sent automatically.
            </p>
          </div>
        </Modal>
      )}
      {modal === "demo" && (
        <Modal
          title="Explore every side of Arabati"
          onClose={() => setModal(null)}
        >
          <p className="muted">
            Use the customer, vendor and administrator demo buttons on the
            sign-in page. All roles share the same example records on this
            browser.
          </p>
          <Notice>
            No real booking, email or payment is sent. Reset restores the
            original sample data and signs you out.
          </Notice>
          <div className="stack">
            <Button
              onClick={() => {
                setModal(null);
                navigate("/signin");
              }}
            >
              Choose a demo role
            </Button>
            <Button variant="secondary" onClick={() => setModal("reset")}>
              Reset demo data
            </Button>
          </div>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="Restore the example data?" onClose={() => setModal(null)}>
          <p>
            This removes bookings, accounts, reviews and other changes made on
            this browser. The original examples will be restored.
          </p>
          <div className="button-row">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Keep my changes
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset();
                setModal(null);
                navigate("/");
              }}
            >
              Restore demo
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
