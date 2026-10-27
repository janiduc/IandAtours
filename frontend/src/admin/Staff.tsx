import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { admin } from "../api";
import { useAuth } from "./AuthContext";
import { useRecords } from "./useRecords";

export default function Staff() {
  const { user } = useAuth();
  const { records: users, error, reload } = useRecords(admin.users);
  const [message, setMessage] = useState<string | null>(null);

  if (user?.role !== "admin") return <Navigate to="/admin" replace />;

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await admin.createUser({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
        role: String(form.get("role")),
      });
      formElement.reset();
      setMessage("Account created. Share the password with them privately.");
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't create account");
    }
  }

  async function toggle(id: number, active: boolean) {
    try {
      await admin.updateUser(id, { active });
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn't update account");
    }
  }

  return (
    <>
      <h1>Staff accounts</h1>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role === "admin" ? "Admin" : "Staff"}</td>
                <td>{u.active ? "Active" : "Disabled"}</td>
                <td>
                  {u.id !== user.id && (
                    <button type="button" className="link-button" onClick={() => toggle(u.id, !u.active)}>
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="form editor" onSubmit={create}>
        <h2>Add a staff member</h2>
        <div className="form-row">
          <label>
            Name
            <input name="name" required minLength={2} />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Temporary password (12+ characters)
            <input name="password" type="password" required minLength={12} autoComplete="new-password" />
          </label>
          <label>
            Role
            <select name="role" defaultValue="staff">
              <option value="staff">Staff: bookings, tours, fleet, guides</option>
              <option value="admin">Admin: everything, including staff accounts</option>
            </select>
          </label>
        </div>
        {message && <p className="muted">{message}</p>}
        <button className="btn btn-primary" type="submit">
          Create account
        </button>
      </form>
    </>
  );
}
