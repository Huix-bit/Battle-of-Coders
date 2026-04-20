import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.assignment.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.market.deleteMany();

  const v1 = await prisma.vendor.create({
    data: {
      namaPerniagaan: "Kuih Tradisi Kak Timah",
      namaPanggilan: "Kak Timah",
      noTelefon: "012-3456789",
      jenisJualan: "Kuih-muih & dodol",
      yuranHarianSen: 3500,
      status: "AKTIF",
    },
  });
  const v2 = await prisma.vendor.create({
    data: {
      namaPerniagaan: "Craft Melaka Weave",
      email: "craft@example.com",
      jenisJualan: "Kraftangan & cenderamata",
      yuranHarianSen: 4200,
      status: "AKTIF",
    },
  });

  const m1 = await prisma.market.create({
    data: {
      namaPasar: "Pasar Malam Bandaraya Melaka",
      daerah: "MELAKA_TENGAH",
      alamat: "Kawasan bandar",
      hariOperasi: "Jumaat & Sabtu",
      status: "BEROPERASI",
    },
  });
  const m2 = await prisma.market.create({
    data: {
      namaPasar: "Pasar Malam Universiti",
      daerah: "BUKIT_BERUANG",
      hariOperasi: "Rabu & Khamis",
      status: "BEROPERASI",
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  await prisma.assignment.create({
    data: {
      vendorId: v1.id,
      marketId: m1.id,
      tarikhMula: tomorrow,
      petakStall: "A-12",
      status: "DISAHKAN",
    },
  });
  await prisma.assignment.create({
    data: {
      vendorId: v2.id,
      marketId: m2.id,
      tarikhMula: tomorrow,
      petakStall: "B-04",
      status: "DIJADUALKAN",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
