import { useState, type FormEvent } from "react";

export type Field<T> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "list";
  required?: boolean;
  hint?: string;
};

type Props<T> = {
  title: string;
  fields: Field<T>[];
  initial: Partial<T>;
  onSave: (value: Partial<T>) => Promise<unknown>;
  onCancel: () => void;
};

// A small form for creating or editing one record. "list" fields are edited one item per line.
export default function RecordEditor<T>({ title, fields, initial, onSave, onCancel }: Props<T>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value: Record<string, unknown> = { ...initial };
    for (const field of fields) {
      const raw = form.get(field.name);
      if (field.type === "checkbox") value[field.name] = raw === "on";
      else if (field.type === "number") value[field.name] = Number(raw);
      else if (field.type === "list")
        value[field.name] = String(raw ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      else value[field.name] = String(raw ?? "");
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(value as Partial<T>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
      setBusy(false);
    }
  }

  return (
    <form className="form editor" onSubmit={submit}>
      <h2>{title}</h2>
      {fields.map((field) => {
        const current = initial[field.name] as unknown;
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="checkbox">
              <input type="checkbox" name={field.name} defaultChecked={Boolean(current)} /> {field.label}
            </label>
          );
        }
        return (
          <label key={field.name}>
            {field.label}
            {field.type === "textarea" || field.type === "list" ? (
              <textarea
                name={field.name}
                rows={field.type === "list" ? 4 : 5}
                required={field.required}
                defaultValue={field.type === "list" ? ((current as string[] | undefined) ?? []).join("\n") : String(current ?? "")}
              />
            ) : (
              <input
                name={field.name}
                type={field.type === "number" ? "number" : "text"}
                min={field.type === "number" ? 0 : undefined}
                required={field.required}
                defaultValue={current === undefined ? "" : String(current)}
              />
            )}
            {field.hint && <small className="muted">{field.hint}</small>}
          </label>
        );
      })}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
