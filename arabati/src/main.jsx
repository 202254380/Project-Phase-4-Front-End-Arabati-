import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext.jsx";
import App from "./App.jsx";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>A little pause.</h1>
        <p>
          Something went wrong. Your saved demo data is still on this device.
        </p>
        <button onClick={() => location.reload()}>Reload Arabati</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
