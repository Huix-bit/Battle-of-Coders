"use client";

import { useActionState } from "react";
import { createAssignment, deleteAssignment, updateAssignment } from "@/actions/assignments";
import { createMarket, deleteMarket, updateMarket } from "@/actions/markets";
import { initialActionState } from "@/actions/types";
import { DAERAH_KEYS, DAERAH_LABEL, type DaerahKey } from "@/lib/melaka";
import { toDatetimeLocalValue } from "@/lib/dates";
import {
  ASSIGNMENT_STATUS,
  ASSIGNMENT_STATUS_LABEL,
  MARKET_STATUS,
  MARKET_STATUS_LABEL,
  type AssignmentStatus,
  type MarketStatus,
} from "@/lib/status";
import { FormMessage } from "./form-message";

export type MarketRow = {
  id: string;
  namaPasar: string;
  daerah: string;
  alamat: string | null;
  hariOperasi: string | null;
  status: string;
};

export type AssignmentRow = {
  id: string;
  vendorId: string;
  marketId: string;
  tarikhMula: string;
  tarikhTamat: string | null;
  petakStall: string | null;
  catatan: string | null;
  status: string;
  vendorName: string;
  marketName: string;
};

export type VendorOption = { id: string; namaPerniagaan: string };

function SubmitLabel({ pending, idle }: { pending: boolean; idle: string }) {
  return <>{pending ? "Saving…" : idle}</>;
}

export function JadualPanel(props: {
  markets: MarketRow[];
  vendors: VendorOption[];
  assignments: AssignmentRow[];
}) {
  const { markets, vendors, assignments } = props;

  const [mCreate, mCreateAction, mCreatePending] = useActionState(createMarket, initialActionState);
  const [mEdit, mEditAction, mEditPending] = useActionState(updateMarket, initialActionState);

  const [aCreate, aCreateAction, aCreatePending] = useActionState(createAssignment, initialActionState);
  const [aEdit, aEditAction, aEditPending] = useActionState(updateAssignment, initialActionState);

  const defaultMula = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
    return toDatetimeLocalValue(d);
  })();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Market sites by district</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Melaka districts: Bukit Beruang, Ayer Keroh, Alor Gajah, Jasin &amp; Melaka Tengah — update site status.
        </p>

        <form action={mCreateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Market / location name" name="namaPasar" required placeholder="e.g. Night Market Taman X" />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">District</span>
            <select name="daerah" required className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2">
              {DAERAH_KEYS.map((d) => (
                <option key={d} value={d}>
                  {DAERAH_LABEL[d as DaerahKey]}
                </option>
              ))}
            </select>
          </label>
          <Field label="Short address" name="alamat" placeholder="Street / neighbourhood" />
          <Field label="Operating days" name="hariOperasi" placeholder="e.g. Friday & Saturday" />
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={mCreatePending}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              <SubmitLabel pending={mCreatePending} idle="Add site" />
            </button>
          </div>
          <div className="sm:col-span-2">
            <FormMessage message={mCreate.error} />
          </div>
        </form>

        <FormMessage message={mEdit.error} />
        <ul className="mt-6 space-y-3">
          {markets.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              No sites yet — add a record above.
            </li>
          ) : (
            markets.map((m) => (
              <li key={m.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <details>
                  <summary className="cursor-pointer font-medium">
                    {m.namaPasar}{" "}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      ({DAERAH_LABEL[m.daerah as DaerahKey] ?? m.daerah}) —{" "}
                      {MARKET_STATUS_LABEL[m.status as MarketStatus] ?? m.status}
                    </span>
                  </summary>
                  <form action={mEditAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={m.id} />
                    <Field label="Market name" name="namaPasar" defaultValue={m.namaPasar} required />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">District</span>
                      <select
                        name="daerah"
                        defaultValue={m.daerah}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {DAERAH_KEYS.map((d) => (
                          <option key={d} value={d}>
                            {DAERAH_LABEL[d]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field label="Address" name="alamat" defaultValue={m.alamat ?? ""} />
                    <Field label="Operating days" name="hariOperasi" defaultValue={m.hariOperasi ?? ""} />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Site status</span>
                      <select
                        name="status"
                        defaultValue={m.status}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {MARKET_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {MARKET_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={mEditPending}
                        className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        <SubmitLabel pending={mEditPending} idle="Save site" />
                      </button>
                    </div>
                  </form>
                </details>
                <form action={deleteMarket} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs text-[#E8342A]/80 underline hover:text-[#E8342A]">
                    Delete site
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Assign vendors to sites</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Schedule a stall — start date cannot be in the past. Status follows the operational flow.
        </p>

        <form action={aCreateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Vendor</span>
            <select
              name="vendorId"
              required
              className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            >
              <option value="">— select —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.namaPerniagaan}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-[var(--muted)]">Market site</span>
            <select
              name="marketId"
              required
              className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            >
              <option value="">— select —</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.namaPasar} ({DAERAH_LABEL[m.daerah as DaerahKey]})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Start date &amp; time</span>
            <input
              type="datetime-local"
              name="tarikhMula"
              required
              defaultValue={defaultMula}
              className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">End date (optional)</span>
            <input
              type="datetime-local"
              name="tarikhTamat"
              className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            />
          </label>
          <Field label="Stall / booth no." name="petakStall" placeholder="e.g. A-12" />
          <Field label="Notes" name="catatan" placeholder="Short note" />
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={aCreatePending || vendors.length === 0 || markets.length === 0}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              <SubmitLabel pending={aCreatePending} idle="Schedule assignment" />
            </button>
          </div>
          <div className="sm:col-span-2">
            <FormMessage message={aCreate.error} />
          </div>
        </form>

        <FormMessage message={aEdit.error} />
        <ul className="mt-6 space-y-3">
          {assignments.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              No assignments — schedule a vendor to a site above.
            </li>
          ) : (
            assignments.map((a) => (
              <li key={a.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <details>
                  <summary className="cursor-pointer font-medium">
                    {a.vendorName} → {a.marketName}{" "}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      — {ASSIGNMENT_STATUS_LABEL[a.status as AssignmentStatus] ?? a.status}
                    </span>
                  </summary>
                  <form action={aEditAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={a.id} />
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-[var(--muted)]">Vendor</span>
                      <select
                        name="vendorId"
                        defaultValue={a.vendorId}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.namaPerniagaan}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-[var(--muted)]">Site</span>
                      <select
                        name="marketId"
                        defaultValue={a.marketId}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {markets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.namaPasar}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Start date</span>
                      <input
                        type="datetime-local"
                        name="tarikhMula"
                        required
                        defaultValue={toDatetimeLocalValue(new Date(a.tarikhMula))}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">End date</span>
                      <input
                        type="datetime-local"
                        name="tarikhTamat"
                        defaultValue={
                          a.tarikhTamat ? toDatetimeLocalValue(new Date(a.tarikhTamat)) : undefined
                        }
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <Field label="Stall no." name="petakStall" defaultValue={a.petakStall ?? ""} />
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Status</span>
                      <select
                        name="status"
                        defaultValue={a.status}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {ASSIGNMENT_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {ASSIGNMENT_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="sm:col-span-2">
                      <Field label="Notes" name="catatan" defaultValue={a.catatan ?? ""} />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="submit"
                        disabled={aEditPending}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        <SubmitLabel pending={aEditPending} idle="Update assignment" />
                      </button>
                    </div>
                  </form>
                </details>
                <form action={deleteAssignment} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-xs text-[#E8342A]/80 underline hover:text-[#E8342A]">
                    Delete assignment
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
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
      />
    </label>
  );
}
