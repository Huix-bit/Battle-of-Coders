-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPerniagaan" TEXT NOT NULL,
    "namaPanggilan" TEXT,
    "noTelefon" TEXT,
    "email" TEXT,
    "jenisJualan" TEXT NOT NULL,
    "yuranHarianSen" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "namaPasar" TEXT NOT NULL,
    "daerah" TEXT NOT NULL,
    "alamat" TEXT,
    "hariOperasi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIRANCANG',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "tarikhMula" DATETIME NOT NULL,
    "tarikhTamat" DATETIME,
    "petakStall" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DIJADUALKAN',
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Assignment_marketId_idx" ON "Assignment"("marketId");

-- CreateIndex
CREATE INDEX "Assignment_vendorId_idx" ON "Assignment"("vendorId");

-- CreateIndex
CREATE INDEX "Assignment_tarikhMula_idx" ON "Assignment"("tarikhMula");
