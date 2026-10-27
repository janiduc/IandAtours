import { Outlet, Route, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import { AuthProvider } from "./admin/AuthContext";
import Bookings from "./admin/Bookings";
import { GuidesAdmin, ToursAdmin, VehiclesAdmin } from "./admin/Catalog";
import Login from "./admin/Login";
import Staff from "./admin/Staff";
import Layout from "./components/Layout";
import Book from "./pages/Book";
import BookingStatusPage from "./pages/BookingStatusPage";
import Contact from "./pages/Contact";
import Fleet from "./pages/Fleet";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import TourDetail from "./pages/TourDetail";
import Tours from "./pages/Tours";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tours" element={<Tours />} />
        <Route path="tours/:slug" element={<TourDetail />} />
        <Route path="book/:slug" element={<Book />} />
        <Route path="booking/:reference" element={<BookingStatusPage />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Bookings />} />
          <Route path="tours" element={<ToursAdmin />} />
          <Route path="vehicles" element={<VehiclesAdmin />} />
          <Route path="guides" element={<GuidesAdmin />} />
          <Route path="staff" element={<Staff />} />
        </Route>
      </Route>
    </Routes>
  );
}
