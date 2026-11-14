import React, { createContext, useContext, useEffect, useState } from "react";
import {
  readStore,
  transaction,
  resetStore,
  SESSION_KEY,
  STORE_KEY,
  persistenceAvailable,
} from "../services/repository.js";
const Context = createContext(null);
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
export function AppProvider({ children }) {
  const [state, setState] = useState(readStore),
    [session, setSession] = useState(getSession),
    [toast, setToast] = useState(null);
  const user =
    state.users.find(
      (u) =>
        u.id === session?.userId &&
        u.status === "Active" &&
        (u.sessionVersion || 0) === (session?.version || 0),
    ) || null;
  useEffect(() => {
    const update = (e) => {
      if (e.key === STORE_KEY) setState(readStore());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (session && !user) {
      sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
      setToast({
        message: "Your session ended. Please sign in again.",
        tone: "info",
      });
    }
  }, [state, session, user]);
  const run = async (type, payload = {}) => {
    const out = await transaction(user?.id, type, payload);
    setState(out.state);
    return out.result;
  };
  const signIn = async (email, password) => {
    const out = await transaction(null, "signIn", { email, password });
    setState(out.state);
    const u = out.state.users.find((v) => v.id === out.result);
    const next = { userId: u.id, version: u.sessionVersion || 0 };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return u;
  };
  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  };
  const reset = () => {
    setState(resetStore());
    setSession(null);
    setToast({
      message: "Demo restored. All example records are ready to explore.",
      tone: "success",
    });
  };
  const flash = (message, tone = "success") => setToast({ message, tone });
  return (
    <Context.Provider
      value={{
        state,
        user,
        run,
        signIn,
        signOut,
        reset,
        flash,
        toast,
        setToast,
        persistenceAvailable,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
