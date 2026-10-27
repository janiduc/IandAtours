import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../api";
import { useFetch } from "../useFetch";
import CurrencyToggle from "./CurrencyToggle";
import Logo from "./Logo";
import WhatsAppButton from "./WhatsAppButton";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/tours", label: "Tours" },
  { to: "/plan", label: "Plan my trip", assistant: true },
  { to: "/fleet", label: "Our Fleet" },
  { to: "/contact", label: "About & Contact" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: assistant } = useFetch(() => api.assistantOptions(), []);
  const nav = NAV.filter((item) => !item.assistant || assistant?.enabled);
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <Logo />
          </NavLink>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <nav id="main-nav" className={menuOpen ? "nav open" : "nav"}>
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="container currency-bar">
          <CurrencyToggle />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} I&amp;A Tours · Private tours and vehicle hire across Sri Lanka</p>
        </div>
      </footer>
      <WhatsAppButton floating />
    </>
  );
}
