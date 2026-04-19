import { z } from "zod";
import { DAERAH_KEYS } from "./melaka";
import { isBeforeToday, isValidDateRange, startOfDay } from "./dates";
import { rmStringToSen } from "./money";
import {
  ASSIGNMENT_STATUS,
  MARKET_STATUS,
  VENDOR_STATUS,
} from "./status";

const daerahTuple = DAERAH_KEYS as unknown as [string, ...string[]];

const vendorFields = z.object({
  namaPerniagaan: z.string().min(2, "Nama perniagaan diperlukan"),
  namaPanggilan: z.string().optional(),
  noTelefon: z.string().optional(),
  email: z.union([z.string().email("E-mel tidak sah"), z.literal("")]).optional(),
  jenisJualan: z.string().min(2, "Nyatakan jenis jualan (contoh: kuih, kraftangan)"),
  yuranRm: z.string().min(1, "Yuran petak diperlukan"),
});

function addYuranIssues(data: { yuranRm: string }, ctx: z.RefinementCtx) {
  try {
    const sen = rmStringToSen(data.yuranRm);
    if (sen < 0) {
      ctx.addIssue({ code: "custom", path: ["yuranRm"], message: "Yuran tidak boleh negatif" });
    }
  } catch (e) {
    ctx.addIssue({
      code: "custom",
      path: ["yuranRm"],
      message: e instanceof Error ? e.message : "Format yuran tidak sah",
    });
  }
}

export const vendorCreateSchema = vendorFields.superRefine(addYuranIssues);

export const vendorUpdateSchema = vendorFields
  .extend({
    id: z.string().min(1),
    status: z.enum(VENDOR_STATUS as unknown as [string, ...string[]]),
  })
  .superRefine(addYuranIssues);

export const marketCreateSchema = z.object({
  namaPasar: z.string().min(2, "Nama pasar malam / tapak diperlukan"),
  daerah: z.enum(daerahTuple),
  alamat: z.string().optional(),
  hariOperasi: z.string().optional(),
});

export const marketUpdateSchema = marketCreateSchema.extend({
  id: z.string().min(1),
  status: z.enum(MARKET_STATUS as unknown as [string, ...string[]]),
});

function parseDateInput(s: string, label: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`${label} tidak sah`);
  return d;
}

export const assignmentCreateSchema = z
  .object({
    vendorId: z.string().min(1, "Pilih penjaja"),
    marketId: z.string().min(1, "Pilih tapak pasar"),
    tarikhMula: z.string().min(1, "Tarikh mula diperlukan"),
    tarikhTamat: z.string().optional(),
    petakStall: z.string().optional(),
    catatan: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    let mula: Date;
    try {
      mula = parseDateInput(data.tarikhMula, "Tarikh mula");
    } catch (e) {
      ctx.addIssue({
        code: "custom",
        path: ["tarikhMula"],
        message: e instanceof Error ? e.message : "Tarikh mula tidak sah",
      });
      return;
    }
    if (isBeforeToday(mula)) {
      ctx.addIssue({
        code: "custom",
        path: ["tarikhMula"],
        message: "Tarikh mula tidak boleh pada hari yang telah berlalu",
      });
    }
    let tamat: Date | null = null;
    if (data.tarikhTamat && data.tarikhTamat.length > 0) {
      try {
        tamat = parseDateInput(data.tarikhTamat, "Tarikh tamat");
      } catch (e) {
        ctx.addIssue({
          code: "custom",
          path: ["tarikhTamat"],
          message: e instanceof Error ? e.message : "Tarikh tamat tidak sah",
        });
        return;
      }
      if (!isValidDateRange(mula, tamat)) {
        ctx.addIssue({
          code: "custom",
          path: ["tarikhTamat"],
          message: "Tarikh tamat mesti pada atau selepas tarikh mula",
        });
      }
    }
  });

export const assignmentUpdateSchema = z
  .object({
    id: z.string().min(1),
    vendorId: z.string().min(1),
    marketId: z.string().min(1),
    tarikhMula: z.string().min(1),
    tarikhTamat: z.string().optional(),
    petakStall: z.string().optional(),
    catatan: z.string().optional(),
    status: z.enum(ASSIGNMENT_STATUS as unknown as [string, ...string[]]),
  })
  .superRefine((data, ctx) => {
    let mula: Date;
    try {
      mula = parseDateInput(data.tarikhMula, "Tarikh mula");
    } catch (e) {
      ctx.addIssue({
        code: "custom",
        path: ["tarikhMula"],
        message: e instanceof Error ? e.message : "Tarikh mula tidak sah",
      });
      return;
    }
    if (isBeforeToday(mula)) {
      ctx.addIssue({
        code: "custom",
        path: ["tarikhMula"],
        message: "Tarikh mula tidak boleh pada hari yang telah berlalu",
      });
    }
    if (data.tarikhTamat && data.tarikhTamat.length > 0) {
      let tamat: Date;
      try {
        tamat = parseDateInput(data.tarikhTamat, "Tarikh tamat");
      } catch (e) {
        ctx.addIssue({
          code: "custom",
          path: ["tarikhTamat"],
          message: e instanceof Error ? e.message : "Tarikh tamat tidak sah",
        });
        return;
      }
      if (!isValidDateRange(mula, tamat)) {
        ctx.addIssue({
          code: "custom",
          path: ["tarikhTamat"],
          message: "Tarikh tamat mesti pada atau selepas tarikh mula",
        });
      }
    }
  });

export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join("; ");
}

/** Untuk semakan pantas tanpa Zod (contoh: kemas kini status sahaja) */
export function assertTarikhMulaTidakLampau(tarikhMula: Date): void {
  if (isBeforeToday(tarikhMula)) {
    throw new Error("Tarikh mula tidak boleh pada hari yang telah berlalu");
  }
}

export function assertJulatTarikh(mula: Date, tamat: Date | null): void {
  if (tamat && startOfDay(tamat).getTime() < startOfDay(mula).getTime()) {
    throw new Error("Tarikh tamat mesti pada atau selepas tarikh mula");
  }
}
