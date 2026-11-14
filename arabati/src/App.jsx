import React, { useEffect, useState } from "react";
import { useApp } from "./context/AppContext.jsx";
import { Shell } from "./layouts/Shell.jsx";
import { Discover, CartProfile } from "./pages/Discover.jsx";
import { SignIn, Register, ResetPassword } from "./pages/Auth.jsx";
import {
  BookingList,
  RequestBooking,
  BookingConfirmation,
  BookingDetail,
  ReviewBooking,
} from "./pages/Bookings.jsx";
import {
  VendorDashboard,
  VendorRequest,
  AvailabilityCalendar,
  ListingEditor,
} from "./pages/Vendor.jsx";
import {
  AdminDashboard,
  Applications,
  VerifyListing,
  Moderation,
  Records,
} from "./pages/Admin.jsx";
import { Account, Alerts } from "./pages/Account.jsx";
import { Empty, Link, navigate } from "./components/UI.jsx";
function useRoute() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || "/");
  useEffect(() => {
    const change = () => setHash(location.hash.slice(1) || "/");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const [path, search = ""] = hash.split("?");
  return { path, query: new URLSearchParams(search), hash };
}
function Protected({ roles, children, hash }) {
  const { user } = useApp();
  useEffect(() => {
    if (!user) navigate(`/signin?next=${encodeURIComponent(hash)}`);
  }, [user, hash]);
  if (!user)
    return (
      <div className="loading-page" role="status">
        Opening sign in…
      </div>
    );
  if (roles && !roles.includes(user.role))
    return (
      <Empty
        icon="lock"
        title="This view belongs to another role"
        action={
          <Link to="/account" className="button primary">
            Your account
          </Link>
        }
      >
        Use a matching demo account to explore this part of Arabati.
      </Empty>
    );
  return children;
}
export default function App() {
  const route = useRoute(),
    { path, query, hash } = route;
  const parts = path.split("/").filter(Boolean);
  let page, roles;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("main-content")?.focus({ preventScroll: true });
    const title =
      path === "/"
        ? "A cart for every occasion"
        : path.includes("vendor")
          ? "Vendor dashboard"
          : path.includes("admin")
            ? "Administration"
            : (parts[0] || "Discover").replaceAll("-", " ");
    document.title = `Arabati | ${title.charAt(0).toUpperCase() + title.slice(1)}`;
  }, [hash]);
  if (path === "/") page = <Discover />;
  else if (parts[0] === "cart" && parts[1])
    page = <CartProfile id={parts[1]} />;
  else if (path === "/signin") page = <SignIn query={query} />;
  else if (path === "/register") page = <Register />;
  else if (path === "/reset") page = <ResetPassword query={query} />;
  else if (path === "/bookings") {
    roles = ["customer"];
    page = <BookingList />;
  } else if (parts[0] === "request" && parts[1]) {
    roles = ["customer"];
    page = <RequestBooking id={parts[1]} query={query} />;
  } else if (parts[0] === "confirmation" && parts[1]) {
    roles = ["customer"];
    page = <BookingConfirmation id={parts[1]} />;
  } else if (parts[0] === "booking" && parts[1]) {
    roles = ["customer"];
    page = <BookingDetail id={parts[1]} />;
  } else if (parts[0] === "review" && parts[1]) {
    roles = ["customer"];
    page = <ReviewBooking id={parts[1]} />;
  } else if (path === "/vendor") {
    roles = ["vendor"];
    page = <VendorDashboard />;
  } else if (parts[0] === "vendor" && parts[1] === "request" && parts[2]) {
    roles = ["vendor"];
    page = <VendorRequest id={parts[2]} />;
  } else if (path === "/calendar") {
    roles = ["vendor"];
    page = <AvailabilityCalendar />;
  } else if (path === "/listing") {
    roles = ["vendor"];
    page = <ListingEditor />;
  } else if (path === "/admin") {
    roles = ["admin"];
    page = <AdminDashboard />;
  } else if (path === "/applications") {
    roles = ["admin"];
    page = <Applications />;
  } else if (parts[0] === "application" && parts[1]) {
    roles = ["admin"];
    page = <VerifyListing id={parts[1]} />;
  } else if (path === "/moderation") {
    roles = ["admin"];
    page = <Moderation query={query} />;
  } else if (path === "/records") {
    roles = ["admin"];
    page = <Records query={query} />;
  } else if (parts[0] === "oversight" && parts[1]) {
    roles = ["admin"];
    page = <BookingDetail id={parts[1]} admin />;
  } else if (path === "/account") {
    roles = ["customer", "vendor", "admin"];
    page = <Account />;
  } else if (path === "/alerts") {
    roles = ["customer", "vendor", "admin"];
    page = <Alerts />;
  } else
    page = (
      <Empty
        icon="search"
        title="This little path leads elsewhere"
        action={
          <Link to="/" className="button primary">
            Back to Discover
          </Link>
        }
      >
        We couldn’t find that page.
      </Empty>
    );
  return (
    <Shell path={path}>
      <React.Fragment key={hash}>
        {roles ? (
          <Protected roles={roles} hash={hash}>
            {page}
          </Protected>
        ) : (
          page
        )}
      </React.Fragment>
    </Shell>
  );
}
