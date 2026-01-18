import bcrypt from "bcrypt";
import { prisma } from "../src/prismaClient.js";
async function main() {
  console.log("Seeding users...");

  const users = [
    { username: "ElonMusk", password: "password123" },
    { username: "MarkZuckerberg", password: "password123" },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: hashed },
    });
    console.log(`Seeded user: ${u.username}`);
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
