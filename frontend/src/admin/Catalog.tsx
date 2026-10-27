import { useState } from "react";
import { admin } from "../api";
import { formatPrice } from "../currency";
import type { AdminTour, AdminVehicle, Guide } from "../types";
import RecordEditor, { type Field } from "./RecordEditor";
import { useRecords } from "./useRecords";

// Generic list + editor page shared by tours, fleet and guides.
function CatalogPage<T extends { id: number }>({
  title,
  noun,
  load,
  save,
  fields,
  blank,
  columns,
}: {
  title: string;
  noun: string;
  load: () => Promise<T[]>;
  save: (value: Partial<T>) => Promise<unknown>;
  fields: Field<T>[];
  blank: Partial<T>;
  columns: { label: string; render: (item: T) => React.ReactNode }[];
}) {
  const { records, error, reload } = useRecords(load);
  const [editing, setEditing] = useState<Partial<T> | null>(null);

  if (editing) {
    return (
      <RecordEditor
        title={editing.id ? `Edit ${noun}` : `New ${noun}`}
        fields={fields}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={async (value) => {
          await save(value);
          setEditing(null);
          reload();
        }}
      />
    );
  }

  return (
    <>
      <div className="section-head">
        <h1>{title}</h1>
        <button className="btn btn-primary" type="button" onClick={() => setEditing(blank)}>
          Add {noun}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {records?.map((item) => (
              <tr key={item.id}>
                {columns.map((c) => (
                  <td key={c.label}>{c.render(item)}</td>
                ))}
                <td>
                  <button type="button" className="link-button" onClick={() => setEditing(item)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export function ToursAdmin() {
  return (
    <CatalogPage<AdminTour>
      title="Tours"
      noun="tour"
      load={admin.tours}
      save={admin.saveTour}
      blank={{ published: true, featured: false, duration_days: 1, highlights: [], image_url: "/images/tours/" }}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "slug", label: "Web address", required: true, hint: "Lowercase words joined by hyphens, e.g. yala-safari" },
        { name: "region", label: "Region", required: true },
        { name: "duration_days", label: "Days", type: "number", required: true },
        { name: "price_usd", label: "Price per person (USD, foreign visitors)", type: "number", required: true },
        { name: "price_lkr", label: "Price per person (LKR, Sri Lankans)", type: "number", required: true },
        { name: "summary", label: "Short summary", type: "textarea", required: true },
        { name: "description", label: "Full description", type: "textarea", required: true },
        { name: "highlights", label: "Highlights (one per line)", type: "list" },
        { name: "image_url", label: "Image path", required: true },
        { name: "featured", label: "Show on home page", type: "checkbox" },
        { name: "published", label: "Visible on the website", type: "checkbox" },
      ]}
      columns={[
        { label: "Tour", render: (t) => t.title },
        { label: "Days", render: (t) => t.duration_days },
        { label: "USD", render: (t) => formatPrice(t.price_usd, "USD") },
        { label: "LKR", render: (t) => formatPrice(t.price_lkr, "LKR") },
        { label: "Featured", render: (t) => yesNo(t.featured) },
        { label: "Visible", render: (t) => yesNo(t.published) },
      ]}
    />
  );
}

export function VehiclesAdmin() {
  return (
    <CatalogPage<AdminVehicle>
      title="Fleet"
      noun="vehicle"
      load={admin.vehicles}
      save={admin.saveVehicle}
      blank={{ active: true, air_conditioned: true, seats: 3, image_url: "/images/fleet/" }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "category", label: "Type (Car, Van, Coach…)", required: true },
        { name: "seats", label: "Passengers", type: "number", required: true },
        { name: "description", label: "Description", type: "textarea", required: true },
        { name: "image_url", label: "Image path", required: true },
        { name: "air_conditioned", label: "Air conditioned", type: "checkbox" },
        { name: "active", label: "Available (shown on the website)", type: "checkbox" },
      ]}
      columns={[
        { label: "Vehicle", render: (v) => v.name },
        { label: "Type", render: (v) => v.category },
        { label: "Passengers", render: (v) => v.seats },
        { label: "Available", render: (v) => yesNo(v.active) },
      ]}
    />
  );
}

export function GuidesAdmin() {
  return (
    <CatalogPage<Guide>
      title="Guides"
      noun="guide"
      load={admin.guides}
      save={admin.saveGuide}
      blank={{ active: true, languages: ["English"], notes: "" }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", required: true },
        { name: "languages", label: "Languages (one per line)", type: "list" },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "active", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { label: "Name", render: (g) => g.name },
        { label: "Phone", render: (g) => g.phone },
        { label: "Languages", render: (g) => g.languages.join(", ") },
        { label: "Active", render: (g) => yesNo(g.active) },
      ]}
    />
  );
}
