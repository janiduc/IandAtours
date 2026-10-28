import { Link } from "react-router-dom";
import { formatPhone, WHATSAPP_NUMBERS } from "../contact";
import { usePageMeta } from "../usePageMeta";

// Plain-language privacy notice written for Sri Lanka's Personal Data Protection Act (No. 9 of 2022)
// and the EU GDPR. Have it reviewed before launch and update it when data handling changes.
const LAST_UPDATED = "27 October 2026";

export default function Privacy() {
  usePageMeta("Privacy policy", "How I&A Tours collects, uses and protects your personal information.");
  const contact = WHATSAPP_NUMBERS.map(formatPhone).join(" or ");

  return (
    <article className="container section narrow prose">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated {LAST_UPDATED}</p>

      <p>
        I&amp;A Tours ("we") is a tour agency in Sri Lanka. This page explains what personal information we collect
        when you use this website, why, and the choices you have. We follow Sri Lanka's Personal Data Protection Act,
        No. 9 of 2022, and, for visitors from the European Union, the General Data Protection Regulation (GDPR).
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Booking details:</strong> your name, email, phone or WhatsApp number, country, travel date, number of
          travellers and any special requests you write.
        </li>
        <li>
          <strong>Payment records:</strong> the amount, currency, payment method type and the payment provider's
          reference. We never see or store your card number. Card payments are handled by PayHere.
        </li>
        <li>
          <strong>Trip planner chats:</strong> the messages you type into "Plan my trip". We don't store them on our
          servers, and you don't need to give your name to use it.
        </li>
        <li>
          <strong>Technical data:</strong> your IP address, kept briefly to protect the site from abuse.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To arrange your tour: confirming dates, assigning a guide and vehicle, and contacting you about it.</li>
        <li>To take payment and keep the accounting records the law requires.</li>
        <li>To answer your questions and plan custom trips.</li>
      </ul>
      <p>
        Our legal basis is carrying out the booking you asked for, our legal obligations, and our legitimate interest
        in running a safe website. We don't sell your data or use it for advertising.
      </p>

      <h2>Who we share it with</h2>
      <ul>
        <li>
          <strong>PayHere</strong> (Sri Lanka), to process card payments.
        </li>
        <li>
          <strong>Our AI model provider</strong>, which receives trip planner messages. Our staff assistant also sends
          it booking details (first name, country, tour, dates, group size and special requests, never your email or
          phone) to help draft replies. Staff review every message before it is sent to you.
        </li>
        <li>
          <strong>Our hosting provider</strong>, which stores the website and its database.
        </li>
        <li>Your guide and driver, who receive what they need to run your tour.</li>
      </ul>
      <p>Some of these providers may process data outside Sri Lanka, with safeguards required by law.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep booking and payment records for as long as Sri Lankan tax and accounting law requires, then delete
        them. You can ask us to delete other information sooner.
      </p>

      <h2>Cookies and storage</h2>
      <p>
        The public site uses no tracking or advertising cookies. Your browser remembers whether you chose USD or LKR
        prices. Staff who sign in to the admin area get one secure session cookie.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the information we hold about you, correct it, delete it, or object to how we use it. You
        can also complain to Sri Lanka's Data Protection Authority, or your local authority if you are in the EU.
      </p>

      <h2>Contact us</h2>
      <p>
        For any privacy question or request, message us on WhatsApp at {contact}, quoting your booking reference if
        you have one. You can also <Link to="/contact">find our other contact details here</Link>.
      </p>
    </article>
  );
}
