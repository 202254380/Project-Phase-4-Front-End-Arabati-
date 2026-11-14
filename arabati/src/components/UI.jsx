import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
export const href = (path) => `#${path}`;
export function navigate(path) {
  if (location.hash === href(path))
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = path;
}
export function Link({ to, children, className = "", ...props }) {
  return (
    <a href={href(to)} className={className} {...props}>
      {children}
    </a>
  );
}
export function Button({
  children,
  variant = "primary",
  icon,
  busy = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`button ${variant} ${className}`}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy ? <span className="spinner" /> : icon && <Icon name={icon} />}
      <span>{busy ? "Please wait…" : children}</span>
    </button>
  );
}
export function Field({
  label,
  hint,
  error,
  children,
  required = false,
  className = "",
}) {
  const uid = useId(),
    id = children?.props?.id || uid;
  const desc = `${id}-hint`;
  let found = false;
  const enhance = (node) => {
    if (!React.isValidElement(node)) return node;
    if (!found && ["input", "select", "textarea"].includes(node.type)) {
      found = true;
      return React.cloneElement(node, {
        id,
        "aria-required": required || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": hint || error ? desc : undefined,
      });
    }
    if (node.props.children)
      return React.cloneElement(
        node,
        {},
        React.Children.map(node.props.children, enhance),
      );
    return node;
  };
  return (
    <div className={`field ${error ? "has-error" : ""} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required" aria-label="required">
            {" "}
            *
          </span>
        )}
      </label>
      {enhance(children)}
      {(error || hint) && (
        <span id={desc} className={`field-hint ${error ? "error-text" : ""}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
export function Check({ children, error, ...props }) {
  const uid = useId();
  return (
    <div>
      <label className="check-row">
        <input
          type="checkbox"
          aria-describedby={error ? uid : undefined}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p className="error-text field-hint" id={uid}>
          {error}
        </p>
      )}
    </div>
  );
}
export function FormAlert({ error }) {
  return error ? (
    <div className="notice danger" role="alert">
      <Icon name="info" />
      <span>{typeof error === "string" ? error : error.message}</span>
    </div>
  ) : null;
}
export function Notice({ children, tone = "info", icon = "info" }) {
  return (
    <div className={`notice ${tone}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}
export function Badge({ status, children }) {
  return (
    <span
      className={`badge badge-${String(status || "neutral")
        .toLowerCase()
        .replaceAll(" ", "-")}`}
    >
      {children || status}
    </span>
  );
}
export function Empty({
  icon = "search",
  title = "Nothing here yet",
  children,
  action,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function PageHeading({ eyebrow, title, children, action, back }) {
  return (
    <div className="page-heading">
      {back && (
        <Link className="back-link" to={back}>
          <Icon name="back" />
          Back
        </Link>
      )}
      <div className="heading-row">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {children && <p className="page-intro">{children}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
export function Tabs({ items, value, onChange, label = "View" }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((item) => {
        const i =
          typeof item === "string" ? { value: item, label: item } : item;
        return (
          <button
            key={i.value}
            type="button"
            aria-pressed={value === i.value}
            className={value === i.value ? "active" : ""}
            onClick={() => onChange(i.value)}
          >
            {i.icon && <Icon name={i.icon} size={17} />}
            <span>{i.label}</span>
            {i.count !== undefined && (
              <span className="tab-count">{i.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const lock = useRef(false);
  const execute = async (fn) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e);
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return false;
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return { execute, busy, error, fields: error?.fields || {}, setError };
}
export function Pagination({ total, page, onChange, size = 20 }) {
  const pages = Math.ceil(total / size);
  if (pages < 2) return null;
  return (
    <div className="pagination">
      <Button
        variant="secondary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {pages}
      </span>
      <Button
        variant="secondary"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
export function Stars({ rating = 0 }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          size={16}
          fill={i < Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}
