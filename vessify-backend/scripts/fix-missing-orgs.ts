import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`Found ${users.length} user(s)`);

  for (const user of users) {
    const member = await prisma.member.findFirst({ where: { userId: user.id } });
    if (!member) {
      console.log(`No org for ${user.email} — creating...`);
      const prefix = user.email.split("@")[0] ?? "user";
      const slug = `${prefix}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

      const org = await prisma.organization.create({
        data: {
          id: crypto.randomUUID(),
          name: `${prefix}'s Organization`,
          slug,
        },
      });

      await prisma.member.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          organizationId: org.id,
          role: "owner",
        },
      });

      console.log(`✓ Created org ${org.id} for ${user.email}`);
    } else {
      console.log(`✓ ${user.email} already has org ${member.organizationId}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
