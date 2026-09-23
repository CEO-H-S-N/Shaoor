// Shaoor.org — Designer Account Seed Script
// This script inserts the Designer (super admin) account directly into the database.
// Designer accounts are NEVER created through OAuth — only through this seed.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Shaoor.org database...\n");

  // ─── Designer Account ─────────────────────────────────────
  // This is the root administrative account. Update email before running.
  const designerEmail = process.env.DESIGNER_EMAIL || "designer@shaoor.org";

  const designer = await prisma.user.upsert({
    where: { email: designerEmail },
    update: {
      role: "DESIGNER",
      isActive: true,
    },
    create: {
      email: designerEmail,
      name: "Platform Designer",
      role: "DESIGNER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Designer account created/updated: ${designer.email} (ID: ${designer.id})`);

  // ─── Default Categories ────────────────────────────────────
  const defaultCategories = [
    {
      name: "Social Sciences",
      slug: "social-sciences",
      description: "Research in sociology, anthropology, political science, and related fields",
      color: "#1a237e",
      sortOrder: 1,
    },
    {
      name: "Education",
      slug: "education",
      description: "Studies in pedagogy, curriculum development, and educational policy",
      color: "#0052cc",
      sortOrder: 2,
    },
    {
      name: "Health & Medicine",
      slug: "health-medicine",
      description: "Medical research, public health, and health policy studies",
      color: "#00695c",
      sortOrder: 3,
    },
    {
      name: "Technology & Innovation",
      slug: "technology-innovation",
      description: "Research in computer science, AI, engineering, and technological advancement",
      color: "#4a148c",
      sortOrder: 4,
    },
    {
      name: "Humanities",
      slug: "humanities",
      description: "Literature, philosophy, history, and cultural studies",
      color: "#bf360c",
      sortOrder: 5,
    },
    {
      name: "Business & Economics",
      slug: "business-economics",
      description: "Research in economics, management, finance, and organizational behavior",
      color: "#1b5e20",
      sortOrder: 6,
    },
  ];

  for (const cat of defaultCategories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`  📂 Category: ${category.name}`);
  }

  console.log(`\n✅ Seeded ${defaultCategories.length} default categories`);
  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
