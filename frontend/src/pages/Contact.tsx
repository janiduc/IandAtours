import WhatsAppButton from "../components/WhatsAppButton";
import { formatPhone, WHATSAPP_NUMBERS, whatsappLink } from "../contact";
import { usePageMeta } from "../usePageMeta";

export default function Contact() {
  usePageMeta("About & contact", "Contact I&A Tours on WhatsApp to plan a private tour in Sri Lanka.");
  return (
    <section className="container section narrow">
      <h1>About I&amp;A Tours</h1>
      <p>
        I&amp;A Tours is a Sri Lankan tour agency offering private tours, round trips and vehicle hire across the
        island. We plan trips for travellers from around the world and for local families, with experienced
        driver-guides and a modern, air-conditioned fleet.
      </p>
      <h2>Get in touch</h2>
      <p>The fastest way to reach us is WhatsApp. Tell us your dates, group size and what you'd like to see.</p>
      <p>
        <WhatsAppButton />
      </p>
      <ul className="contact-numbers">
        {WHATSAPP_NUMBERS.map((number) => (
          <li key={number}>
            WhatsApp / phone:{" "}
            <a href={whatsappLink("Hi I&A Tours, I'd like to know more about your tours.", number)} target="_blank" rel="noopener noreferrer">
              {formatPhone(number)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
