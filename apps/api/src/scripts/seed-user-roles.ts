import { db } from '../db';
import { users, userRoles } from '../db/schema';
import { asc, eq } from 'drizzle-orm';

async function main() {
  console.log('Backfilling user_roles from users.role...');

  const allUsers = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .orderBy(asc(users.id));

  let inserted = 0;
  for (const u of allUsers) {
    if (!u.role) continue;
    await db
      .insert(userRoles)
      .values({ userId: u.id, role: u.role as any })
      .onConflictDoNothing();
    inserted++;
  }

  console.log(`Done. Processed ${allUsers.length} users.`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });


