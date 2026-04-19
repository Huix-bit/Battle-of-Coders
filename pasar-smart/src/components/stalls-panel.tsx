"use client";

import { useActionState } from "react";
import { createStall, deleteStall, updateStall } from "@/actions/stalls";
import { initialActionState } from "@/actions/types";
import { DAERAH_LABEL, type DaerahKey } from "@/lib/melaka";
import { STALL_STATUS, STALL_STATUS_LABEL, type StallStatus } from "@/lib/status";
import type { VendorOption } from "@/components/jadual-panel";
import { FormMessage } from "./form-message";

export type StallRow = {
  id: string;
  vendorId: string;
  vendorName: string;
  marketId: string | null;
  marketName: string | null;
  name: string;
  category: string;
  status: StallStatus;
  flashSaleActive: boolean;
  isHere: boolean;
  mapLocationX: number | null;
  mapLocationY: number | null;
};

export type StallMarketOption = {
  id: string;
  namaPasar: string;
  daerah: string;
};

function SubmitLabel({ pending, idle }: { pending: boolean; idle: string }) {
  return <>{pending ? "Menyimpan…" : idle}</>;
}

export function StallsPanel(props: {
  stalls: StallRow[];
  vendors: VendorOption[];
  markets: StallMarketOption[];
  mode: "admin" | "vendor";
  linkedVendorId: string | null;
}) {
  const { stalls, vendors, markets, mode, linkedVendorId } = props;

  const [createState, createAction, createPending] = useActionState(createStall, initialActionState);
  const [editState, editAction, editPending] = useActionState(updateStall, initialActionState);

  const showCreate = mode === "admin" || (mode === "vendor" && linkedVendorId);

  return (
    <div className="space-y-10">
      {showCreate ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Tambah gerai</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Gerai dipautkan kepada penjaja dan boleh ditempatkan pada peta untuk pasar malam.
          </p>
          <form action={createAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            {mode === "admin" ? (
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="text-[var(--muted)]">Penjaja</span>
                <select
                  name="vendorId"
                  required
                  className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    — pilih penjaja —
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.namaPerniagaan}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <input type="hidden" name="vendorId" value={linkedVendorId ?? ""} />
            )}
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-[var(--muted)]">Tapak pasar (pilihan)</span>
              <select
                name="marketId"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                defaultValue=""
              >
                <option value="">— tiada —</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.namaPasar} ({DAERAH_LABEL[m.daerah as DaerahKey] ?? m.daerah})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Nama gerai</span>
              <input
                name="name"
                required
                placeholder="Contoh: Gerai Kuih Warisan"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Kategori</span>
              <input
                name="category"
                required
                placeholder="Contoh: makanan, kraftangan"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Status gerai</span>
              <select
                name="status"
                required
                defaultValue="OPEN"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
              >
                {STALL_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {STALL_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="isHere" className="rounded border-[var(--border)]" />
              <span>Saya di sini (hadir di tapak)</span>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="flashSaleActive" className="rounded border-[var(--border)]" />
              <span>Jimat kilat aktif</span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Peta X (0–1 atau koordinat)</span>
              <input
                name="mapLocationX"
                placeholder="Contoh: 0.42"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Peta Y</span>
              <input
                name="mapLocationY"
                placeholder="Contoh: 0.58"
                className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
              />
            </label>
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={createPending || (mode === "admin" && vendors.length === 0)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
              >
                <SubmitLabel pending={createPending} idle="Cipta gerai" />
              </button>
            </div>
            <div className="sm:col-span-2">
              <FormMessage message={createState.error} />
            </div>
          </form>
        </section>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Akaun penjaja anda belum dipautkan ke rekod penjaja. Minta pentadbir tetapkan{" "}
          <code className="rounded bg-white/50 px-1">vendor.auth_user_id</code> kepada ID profil anda dalam
          Supabase.
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--accent-strong)]">Senarai gerai</h2>
        <FormMessage message={editState.error} />
        <ul className="mt-4 space-y-3">
          {stalls.length === 0 ? (
            <li className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              Tiada gerai.
            </li>
          ) : (
            stalls.map((s) => (
              <li key={s.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <details>
                  <summary className="cursor-pointer font-medium">
                    {s.name}{" "}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      — {STALL_STATUS_LABEL[s.status]} · {s.vendorName}
                    </span>
                  </summary>
                  <form action={editAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={s.id} />
                    {mode === "admin" ? (
                      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                        <span className="text-[var(--muted)]">Penjaja</span>
                        <select
                          name="vendorId"
                          defaultValue={s.vendorId}
                          required
                          className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                        >
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.namaPerniagaan}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <input type="hidden" name="vendorId" value={s.vendorId} />
                    )}
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-[var(--muted)]">Tapak pasar</span>
                      <select
                        name="marketId"
                        defaultValue={s.marketId ?? ""}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        <option value="">— tiada —</option>
                        {markets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.namaPasar}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Nama gerai</span>
                      <input
                        name="name"
                        required
                        defaultValue={s.name}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Kategori</span>
                      <input
                        name="category"
                        required
                        defaultValue={s.category}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Status</span>
                      <select
                        name="status"
                        defaultValue={s.status}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      >
                        {STALL_STATUS.map((st) => (
                          <option key={st} value={st}>
                            {STALL_STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        name="isHere"
                        defaultChecked={s.isHere}
                        className="rounded border-[var(--border)]"
                      />
                      <span>Saya di sini</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input
                        type="checkbox"
                        name="flashSaleActive"
                        defaultChecked={s.flashSaleActive}
                        className="rounded border-[var(--border)]"
                      />
                      <span>Jimat kilat aktif</span>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Peta X</span>
                      <input
                        name="mapLocationX"
                        defaultValue={s.mapLocationX ?? ""}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-[var(--muted)]">Peta Y</span>
                      <input
                        name="mapLocationY"
                        defaultValue={s.mapLocationY ?? ""}
                        className="rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2"
                      />
                    </label>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="submit"
                        disabled={editPending}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                      >
                        <SubmitLabel pending={editPending} idle="Simpan gerai" />
                      </button>
                    </div>
                  </form>
                </details>
                <form action={deleteStall} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-xs text-red-700 underline hover:underline dark:text-red-300">
                    Padam gerai
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
