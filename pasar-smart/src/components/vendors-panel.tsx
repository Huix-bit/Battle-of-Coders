"use client";

import { useActionState } from "react";
import { createVendor, deleteVendor, updateVendor } from "@/actions/vendors";
import { initialActionState } from "@/actions/types";
import { senToRmLabel } from "@/lib/money";
import { VENDOR_STATUS, VENDOR_STATUS_LABEL, type VendorStatus } from "@/lib/status";
import { FormMessage } from "./form-message";

export type VendorRow = {
  id: string;
  namaPerniagaan: string;
  namaPanggilan: string | null;
  noTelefon: string | null;
  email: string | null;
  jenisJualan: string;
  yuranHarianSen: number;
  status: string;
};

function SubmitLabel({ pending, idle }: { pending: boolean; idle: string }) {
  return <>{pending ? "Saving…" : idle}</>;
}

export function VendorsPanel({ vendors }: { vendors: VendorRow[] }) {
  const [createState, createAction, createPending] = useActionState(createVendor, initialActionState);
  const [editState, editAction, editPending] = useActionState(updateVendor, initialActionState);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Add new vendor</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Register a night market trader — daily stall fee in Ringgit Malaysia (non-negative).
        </p>
        <form action={createAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Business name" name="namaPerniagaan" required />
          <Field label="Nickname" name="namaPanggilan" />
          <Field label="Phone number" name="noTelefon" placeholder="e.g. 012-3456789" />
          <Field label="Email" name="email" type="email" />
          <div className="sm:col-span-2">
            <Field label="Type of goods" name="jenisJualan" required placeholder="e.g. pastries, drinks" />
          </div>
          <Field
            label="Daily stall fee (RM)"
            name="yuranRm"
            required
            placeholder="12.50"
          />
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createPending}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              <SubmitLabel pending={createPending} idle="Save vendor" />
            </button>
          </div>
          <div className="sm:col-span-2">
            <FormMessage message={createState.error} />
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Vendor list</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Update status along the flow: Draft → Active / Suspended.</p>
        <FormMessage message={editState.error} />
        <ul className="mt-4 space-y-3">
          {vendors.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
              No vendors yet — add a record above.
            </li>
          ) : (
            vendors.map((v) => (
              <li key={v.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                <details className="group">
                  <summary className="cursor-pointer list-none font-medium text-[var(--text)]">
                    <span className="mr-2 inline-block group-open:rotate-90">▸</span>
                    {v.namaPerniagaan}{" "}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      — {VENDOR_STATUS_LABEL[v.status as VendorStatus] ?? v.status}
                    </span>
                  </summary>
                  <form action={editAction} className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                    <input type="hidden" name="id" value={v.id} />
                    <Field label="Business name" name="namaPerniagaan" defaultValue={v.namaPerniagaan} required />
                    <Field label="Nickname" name="namaPanggilan" defaultValue={v.namaPanggilan ?? ""} />
                    <Field label="Phone number" name="noTelefon" defaultValue={v.noTelefon ?? ""} />
                    <Field label="Email" name="email" type="email" defaultValue={v.email ?? ""} />
                    <div className="sm:col-span-2">
                      <Field label="Type of goods" name="jenisJualan" defaultValue={v.jenisJualan} required />
                    </div>
                    <Field
                      label="Daily stall fee (RM)"
                      name="yuranRm"
                      required
                      defaultValue={senToRmLabel(v.yuranHarianSen)}
                    />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Status</span>
                      <select
                        name="status"
                        defaultValue={v.status}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {VENDOR_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {VENDOR_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={editPending}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
                      >
                        <SubmitLabel pending={editPending} idle="Update" />
                      </button>
                    </div>
                  </form>
                </details>
                <form action={deleteVendor} className="mt-3 flex justify-end">
                  <input type="hidden" name="id" value={v.id} />
                  <button
                    type="submit"
                    className="text-xs text-[#E8342A]/80 underline-offset-2 hover:text-[#E8342A] hover:underline"
                  >
                    Delete record
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
      />
    </label>
  );
}
