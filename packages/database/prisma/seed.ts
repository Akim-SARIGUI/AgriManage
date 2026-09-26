import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@agrimanage.local';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
  const fullName = process.env.ADMIN_NAME ?? 'Administrateur AgriManage';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName,
      role: Role.ADMIN,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin prêt: ${admin.email} (mdp: ${password})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
