import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <p className="container section muted">Loading…</p>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <strong>I&amp;A Tours admin</strong>
          <nav className="admin-nav">
            <NavLink to="/admin" end>
              Bookings
            </NavLink>
            <NavLink to="/admin/tours">Tours</NavLink>
            <NavLink to="/admin/vehicles">Fleet</NavLink>
            <NavLink to="/admin/guides">Guides</NavLink>
            {user.role === "admin" && <NavLink to="/admin/staff">Staff</NavLink>}
          </nav>
          <span className="admin-user">
            {user.name} · <button type="button" className="link-button" onClick={logout}>Sign out</button>
          </span>
        </div>
      </header>
      <main className="container section">
        <Outlet />
      </main>
    </div>
  );
}
