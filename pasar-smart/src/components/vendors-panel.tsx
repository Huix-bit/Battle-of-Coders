"use client";

import { useActionState, useState } from "react";
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

        {vendors.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
            No vendors yet — add a record above.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--lifted)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Daily Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {vendors.map((v, index) => (
                  <VendorTableRow
                    key={v.id}
                    index={index + 1}
                    vendor={v}
                    editAction={editAction}
                    editPending={editPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  AKTIF:     "bg-emerald-400/15 text-emerald-400",
  DRAFT:     "bg-[var(--raised)] text-[var(--muted)]",
  SUSPENDED: "bg-red-400/15 text-red-400",
};

function VendorTableRow({
  index, vendor, editAction, editPending,
}: {
  index: number;
  vendor: VendorRow;
  editAction: (payload: FormData) => void;
  editPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const statusLabel = VENDOR_STATUS_LABEL[vendor.status as VendorStatus] ?? vendor.status;
  const statusColor = STATUS_COLORS[vendor.status] ?? STATUS_COLORS.DRAFT;

  return (
    <>
      <tr className="hover:bg-[var(--raised)] transition-colors">
        <td className="px-4 py-3 text-[var(--muted)]">{index}</td>
        <td className="px-4 py-3">
          <p className="font-medium text-[var(--text)]">{vendor.namaPerniagaan}</p>
          {vendor.namaPanggilan && <p className="text-[10px] text-[var(--muted)]">{vendor.namaPanggilan}</p>}
        </td>
        <td className="px-4 py-3 text-[var(--muted)]">{vendor.jenisJualan}</td>
        <td className="px-4 py-3 text-[var(--secondary)]">{senToRmLabel(vendor.yuranHarianSen)}</td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
            {statusLabel}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              {open ? "Close" : "Edit"}
            </button>
            <form action={deleteVendor}>
              <input type="hidden" name="id" value={vendor.id} />
              <button type="submit" className="text-xs text-[#E8342A]/70 hover:text-[#E8342A] hover:underline">
                Delete
              </button>
            </form>
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-[var(--raised)] px-6 pb-5 pt-4">
            <form action={editAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={vendor.id} />
              <Field label="Business name" name="namaPerniagaan" defaultValue={vendor.namaPerniagaan} required />
              <Field label="Nickname" name="namaPanggilan" defaultValue={vendor.namaPanggilan ?? ""} />
              <Field label="Phone number" name="noTelefon" defaultValue={vendor.noTelefon ?? ""} />
              <Field label="Email" name="email" type="email" defaultValue={vendor.email ?? ""} />
              <div className="sm:col-span-2">
                <Field label="Type of goods" name="jenisJualan" defaultValue={vendor.jenisJualan} required />
              </div>
              <Field label="Daily stall fee (RM)" name="yuranRm" required defaultValue={senToRmLabel(vendor.yuranHarianSen)} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-[var(--muted)]">Status</span>
                <select name="status" defaultValue={vendor.status} className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2">
                  {VENDOR_STATUS.map((s) => (
                    <option key={s} value={s}>{VENDOR_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">Cancel</button>
                <button type="submit" disabled={editPending} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60">
                  <SubmitLabel pending={editPending} idle="Update" />
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
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
