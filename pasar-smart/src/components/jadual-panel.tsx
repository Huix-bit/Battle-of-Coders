"use client";

import { useActionState } from "react";
import { createMarket, deleteMarket, updateMarket } from "@/actions/markets";
import { initialActionState } from "@/actions/types";
import { DAERAH_KEYS, DAERAH_LABEL, type DaerahKey } from "@/lib/melaka";
import {
  MARKET_STATUS,
  MARKET_STATUS_LABEL,
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


function SubmitLabel({ pending, idle }: { pending: boolean; idle: string }) {
  return <>{pending ? "Saving…" : idle}</>;
}

export function JadualPanel(props: {
  markets: MarketRow[];
}) {
  const { markets } = props;

  const [mCreate, mCreateAction, mCreatePending] = useActionState(createMarket, initialActionState);
  const [mEdit, mEditAction, mEditPending] = useActionState(updateMarket, initialActionState);

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
