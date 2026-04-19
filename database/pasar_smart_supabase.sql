-- PASAR-SMART — PostgreSQL / Supabase schema
-- Mirrors prisma/migrations/20260419021622_init/migration.sql (SQLite → Postgres types)

CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPerniagaan" TEXT NOT NULL,
    "namaPanggilan" TEXT,
    "noTelefon" TEXT,
    "email" TEXT,
    "jenisJualan" TEXT NOT NULL,
    "yuranHarianSen" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPasar" TEXT NOT NULL,
    "daerah" TEXT NOT NULL,
    "alamat" TEXT,
    "hariOperasi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIRANCANG',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "tarikhMula" TIMESTAMPTZ NOT NULL,
    "tarikhTamat" TIMESTAMPTZ,
    "petakStall" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIJADUALKAN',
    "catatan" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Assignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Assignment_marketId_idx" ON "Assignment" ("marketId");
CREATE INDEX "Assignment_vendorId_idx" ON "Assignment" ("vendorId");
CREATE INDEX "Assignment_tarikhMula_idx" ON "Assignment" ("tarikhMula");
