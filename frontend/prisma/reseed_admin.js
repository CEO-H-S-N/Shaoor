const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete old placeholder account if it exists
  await prisma.user.deleteMany({ where: { email: "designer@shaoor.org" } });

  // Create/update with the real Gmail
  const designer = await prisma.user.upsert({
    where: { email: "hassanedu124@gmail.com" },
    update: { role: "DESIGNER", isActive: true, name: "Hassan" },
    create: {
      email: "hassanedu124@gmail.com",
      name: "Hassan",
      role: "DESIGNER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("Designer account ready: " + designer.email + " (ID: " + designer.id + ")");
  await pool.end();
}

main().catch(function(e) { console.error(e); process.exit(1); });
