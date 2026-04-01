import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (reverse order of dependencies)
  await prisma.revenue.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.requestLine.deleteMany();
  await prisma.request.deleteMany();
  await prisma.tariff.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // ──────────── USERS ────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: { username: "admin", password: adminPassword, fullName: "Administrateur Système", role: "ADMIN" },
  });

  const yazakiPassword = await bcrypt.hash("yazaki123", 10);
  const yazaki = await prisma.user.create({
    data: { username: "yazaki", password: yazakiPassword, fullName: "Ghada Ben Salah", role: "YAZAKI" },
  });

  const yazaki2Password = await bcrypt.hash("yazaki123", 10);
  const yazaki2 = await prisma.user.create({
    data: { username: "yazaki2", password: yazaki2Password, fullName: "Amira Khelifi", role: "YAZAKI" },
  });

  const srtgPassword = await bcrypt.hash("srtg123", 10);
  const srtg = await prisma.user.create({
    data: { username: "srtg", password: srtgPassword, fullName: "Agent SRTG", role: "SRTG" },
  });

  // ──────────── BUSES ────────────
  const bus1 = await prisma.bus.create({ data: { busNumber: "BUS-001", busType: "Standard", capacity: 40 } });
  const bus2 = await prisma.bus.create({ data: { busNumber: "BUS-002", busType: "Standard", capacity: 40 } });
  const bus3 = await prisma.bus.create({ data: { busNumber: "BUS-003", busType: "Grand", capacity: 55 } });
  const bus4 = await prisma.bus.create({ data: { busNumber: "BUS-004", busType: "Grand", capacity: 55 } });
  const bus5 = await prisma.bus.create({ data: { busNumber: "BUS-005", busType: "Mini", capacity: 20 } });
  const bus6 = await prisma.bus.create({ data: { busNumber: "BUS-006", busType: "Standard", capacity: 40 } });
  const bus7 = await prisma.bus.create({ data: { busNumber: "BUS-007", busType: "Mini", capacity: 20, isActive: false } });

  // ──────────── DRIVERS ────────────
  const d1 = await prisma.driver.create({ data: { matricule: "CH-001", fullName: "Mohamed Ben Ali", phone: "76123456" } });
  const d2 = await prisma.driver.create({ data: { matricule: "CH-002", fullName: "Ahmed Trabelsi", phone: "76234567" } });
  const d3 = await prisma.driver.create({ data: { matricule: "CH-003", fullName: "Youssef Hammami", phone: "76345678" } });
  const d4 = await prisma.driver.create({ data: { matricule: "CH-004", fullName: "Hassan Mejri", phone: "76456789" } });
  const d5 = await prisma.driver.create({ data: { matricule: "CH-005", fullName: "Omar Gafsi", phone: "76567890" } });
  const d6 = await prisma.driver.create({ data: { matricule: "CH-006", fullName: "Karim Souissi", phone: "76678901" } });
  const d7 = await prisma.driver.create({ data: { matricule: "CH-007", fullName: "Nabil Chaari", phone: "76789012", isActive: false } });

  // Assign some drivers to buses
  await prisma.bus.update({ where: { id: bus1.id }, data: { assignedDriverId: d1.id } });
  await prisma.bus.update({ where: { id: bus2.id }, data: { assignedDriverId: d2.id } });
  await prisma.bus.update({ where: { id: bus3.id }, data: { assignedDriverId: d3.id } });

  // ──────────── TARIFFS (per destination + bus type) ────────────
  const tariffData = [
    // Nearby destinations
    { destination: "Gafsa Nord", Standard: 120, Grand: 180, Mini: 75 },
    { destination: "Gafsa Sud", Standard: 120, Grand: 180, Mini: 75 },
    { destination: "El Ksar", Standard: 130, Grand: 195, Mini: 80 },
    { destination: "Sidi Aïch", Standard: 135, Grand: 200, Mini: 85 },
    // Medium distance
    { destination: "Mdhilla", Standard: 150, Grand: 220, Mini: 90 },
    { destination: "El Guettar", Standard: 145, Grand: 215, Mini: 88 },
    { destination: "Sened", Standard: 160, Grand: 235, Mini: 95 },
    { destination: "Zannouch", Standard: 140, Grand: 210, Mini: 85 },
    { destination: "Belkhir", Standard: 155, Grand: 230, Mini: 92 },
    // Further destinations
    { destination: "Metlaoui", Standard: 170, Grand: 250, Mini: 100 },
    { destination: "Moulares", Standard: 185, Grand: 270, Mini: 110 },
    { destination: "Redeyef", Standard: 200, Grand: 290, Mini: 120 },
  ];

  for (const t of tariffData) {
    await prisma.tariff.create({ data: { destination: t.destination, busType: "Standard", pricePerTrip: t.Standard } });
    await prisma.tariff.create({ data: { destination: t.destination, busType: "Grand", pricePerTrip: t.Grand } });
    await prisma.tariff.create({ data: { destination: t.destination, busType: "Mini", pricePerTrip: t.Mini } });
  }

  // ──────────── REQUESTS ────────────

  // ── Request 1: APPROVED + Planning CONFIRMED (with assignments & revenue)
  const req1 = await prisma.request.create({
    data: {
      userId: yazaki.id,
      date: new Date("2026-03-25"),
      status: "APPROVED",
      createdAt: new Date("2026-03-20"),
      lines: {
        create: [
          { station: "Yazaki → Metlaoui", numberOfBuses: 2, busType: "Standard", shuttleTime: "06:00" },
          { station: "Yazaki → Redeyef", numberOfBuses: 1, busType: "Grand", shuttleTime: "06:00" },
        ],
      },
    },
    include: { lines: true },
  });

  const planning1 = await prisma.planning.create({
    data: { requestId: req1.id, date: new Date("2026-03-25"), status: "CONFIRMED" },
  });

  // Assignments for planning 1
  await prisma.assignment.create({
    data: {
      planningId: planning1.id,
      requestLineId: req1.lines[0].id,
      busId: bus1.id,
      driverId: d1.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-03-25"), amount: 170.00 } },
    },
  });
  await prisma.assignment.create({
    data: {
      planningId: planning1.id,
      requestLineId: req1.lines[0].id,
      busId: bus2.id,
      driverId: d2.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-03-25"), amount: 170.00 } },
    },
  });
  await prisma.assignment.create({
    data: {
      planningId: planning1.id,
      requestLineId: req1.lines[1].id,
      busId: bus3.id,
      driverId: d3.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-03-25"), amount: 290.00 } },
    },
  });

  // ── Request 2: APPROVED + Planning CONFIRMED (older, last week)
  const req2 = await prisma.request.create({
    data: {
      userId: yazaki.id,
      date: new Date("2026-03-28"),
      status: "APPROVED",
      createdAt: new Date("2026-03-23"),
      lines: {
        create: [
          { station: "Yazaki → Gafsa Nord", numberOfBuses: 1, busType: "Standard", shuttleTime: "07:00" },
          { station: "Yazaki → Gafsa Nord", numberOfBuses: 1, busType: "Standard", shuttleTime: "17:00" },
        ],
      },
    },
    include: { lines: true },
  });

  const planning2 = await prisma.planning.create({
    data: { requestId: req2.id, date: new Date("2026-03-28"), status: "CONFIRMED" },
  });

  await prisma.assignment.create({
    data: {
      planningId: planning2.id,
      requestLineId: req2.lines[0].id,
      busId: bus6.id,
      driverId: d5.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-03-28"), amount: 120.00 } },
    },
  });
  await prisma.assignment.create({
    data: {
      planningId: planning2.id,
      requestLineId: req2.lines[1].id,
      busId: bus6.id,
      driverId: d5.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-03-28"), amount: 120.00 } },
    },
  });

  // ── Request 3: APPROVED + Planning DRAFT (SRTG started but not finished)
  const req3 = await prisma.request.create({
    data: {
      userId: yazaki2.id,
      date: new Date("2026-04-02"),
      status: "APPROVED",
      createdAt: new Date("2026-03-29"),
      lines: {
        create: [
          { station: "Yazaki → Mdhilla", numberOfBuses: 2, busType: "Standard", shuttleTime: "06:00" },
          { station: "Yazaki → El Guettar", numberOfBuses: 1, busType: "Mini", shuttleTime: "06:30" },
          { station: "Yazaki → Mdhilla", numberOfBuses: 2, busType: "Standard", shuttleTime: "17:00" },
        ],
      },
    },
    include: { lines: true },
  });

  const planning3 = await prisma.planning.create({
    data: { requestId: req3.id, date: new Date("2026-04-02"), status: "DRAFT" },
  });

  // Only 1 assignment done so far (SRTG hasn't finished)
  await prisma.assignment.create({
    data: {
      planningId: planning3.id,
      requestLineId: req3.lines[0].id,
      busId: bus1.id,
      driverId: d1.id,
      confirmed: true,
      revenue: { create: { date: new Date("2026-04-02"), amount: 150.00 } }, // Mdhilla Standard
    },
  });

  // ── Request 4: PENDING (waiting for SRTG to create planning)
  await prisma.request.create({
    data: {
      userId: yazaki.id,
      date: new Date("2026-04-05"),
      status: "PENDING",
      createdAt: new Date("2026-03-31"),
      lines: {
        create: [
          { station: "Yazaki → Sened", numberOfBuses: 1, busType: "Grand", shuttleTime: "06:00" },
          { station: "Yazaki → Sened", numberOfBuses: 1, busType: "Grand", shuttleTime: "17:30" },
        ],
      },
    },
  });

  // ── Request 5: PENDING (another newer request)
  await prisma.request.create({
    data: {
      userId: yazaki2.id,
      date: new Date("2026-04-07"),
      status: "PENDING",
      createdAt: new Date("2026-04-01"),
      lines: {
        create: [
          { station: "Yazaki → Moulares", numberOfBuses: 3, busType: "Standard", shuttleTime: "05:30" },
          { station: "Yazaki → Redeyef", numberOfBuses: 1, busType: "Mini", shuttleTime: "06:00" },
          { station: "Yazaki → Moulares", numberOfBuses: 3, busType: "Standard", shuttleTime: "16:30" },
          { station: "Yazaki → Redeyef", numberOfBuses: 1, busType: "Mini", shuttleTime: "16:30" },
        ],
      },
    },
  });

  // ── Request 6: REJECTED
  await prisma.request.create({
    data: {
      userId: yazaki.id,
      date: new Date("2026-03-15"),
      status: "REJECTED",
      createdAt: new Date("2026-03-10"),
      lines: {
        create: [
          { station: "Yazaki → Belkhir", numberOfBuses: 5, busType: "Grand", shuttleTime: "06:00" },
        ],
      },
    },
  });

  // ── Request 7: REJECTED (date in the past)
  await prisma.request.create({
    data: {
      userId: yazaki2.id,
      date: new Date("2026-03-12"),
      status: "REJECTED",
      createdAt: new Date("2026-03-08"),
      lines: {
        create: [
          { station: "Yazaki → Zannouch", numberOfBuses: 2, busType: "Standard", shuttleTime: "07:00" },
          { station: "Yazaki → Zannouch", numberOfBuses: 2, busType: "Standard", shuttleTime: "18:00" },
        ],
      },
    },
  });

  console.log("──────────────────────────────────────────");
  console.log("Base de données initialisée avec succès !");
  console.log("──────────────────────────────────────────");
  console.log("");
  console.log("Comptes :");
  console.log("  Admin  → admin / admin123");
  console.log("  Yazaki → yazaki / yazaki123  (Ghada Ben Salah)");
  console.log("  Yazaki → yazaki2 / yazaki123 (Amira Khelifi)");
  console.log("  SRTG   → srtg / srtg123");
  console.log("");
  console.log("Données créées :");
  console.log("  7 bus (1 inactif), 7 chauffeurs (1 inactif)");
  console.log("  36 tarifs (12 destinations × 3 types de bus)");
  console.log("  7 demandes : 2 PENDING, 3 APPROVED, 2 REJECTED");
  console.log("  3 plannings : 2 CONFIRMED, 1 DRAFT (en cours)");
  console.log("  6 affectations avec recettes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
