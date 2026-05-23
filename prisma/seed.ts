// ============================================================
// SIAM COIN — Prisma Seed Data
// Run: npx prisma db seed
// ============================================================

import { PrismaClient, CoinCondition, CoinStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Monks ──────────────────────────────────────────────
  const monks = await Promise.all([
    prisma.monk.upsert({
      where:  { id: 'monk-lp-thuat' },
      update: {},
      create: {
        id:        'monk-lp-thuat',
        nameTh:    'หลวงปู่ทวด เหยียบน้ำทะเลจืด',
        nameEn:    'Luang Phu Thuat',
        templeTh:  'วัดช้างให้',
        templeEn:  'Wat Chang Hai',
        province:  'ปัตตานี',
        birthYear: 2125,
        deathYear: 2225,
        isFamous:  true,
        coinCount: 142,
      },
    }),
    prisma.monk.upsert({
      where:  { id: 'monk-lp-ngern' },
      update: {},
      create: {
        id:        'monk-lp-ngern',
        nameTh:    'หลวงพ่อเงิน วัดบางคลาน',
        nameEn:    'Luang Pho Ngern',
        templeTh:  'วัดบางคลาน',
        templeEn:  'Wat Bang Khlan',
        province:  'พิจิตร',
        birthYear: 2353,
        deathYear: 2462,
        isFamous:  true,
        coinCount: 87,
      },
    }),
    prisma.monk.upsert({
      where:  { id: 'monk-lp-khun' },
      update: {},
      create: {
        id:        'monk-lp-khun',
        nameTh:    'หลวงพ่อคูณ ปริสุทโธ',
        nameEn:    'Luang Pho Khun',
        templeTh:  'วัดบ้านไร่',
        templeEn:  'Wat Ban Rai',
        province:  'นครราชสีมา',
        birthYear: 2466,
        deathYear: 2558,
        isFamous:  true,
        coinCount: 201,
      },
    }),
    prisma.monk.upsert({
      where:  { id: 'monk-somdej-toh' },
      update: {},
      create: {
        id:        'monk-somdej-toh',
        nameTh:    'สมเด็จโต พรหมรังสี',
        nameEn:    'Somdej Toh',
        templeTh:  'วัดระฆังโฆสิตาราม',
        templeEn:  'Wat Rakhang',
        province:  'กรุงเทพมหานคร',
        birthYear: 2331,
        deathYear: 2415,
        isFamous:  true,
        coinCount: 65,
      },
    }),
    prisma.monk.upsert({
      where:  { id: 'monk-lp-suk' },
      update: {},
      create: {
        id:        'monk-lp-suk',
        nameTh:    'หลวงปู่ศุข วัดปากคลองมะขามเฒ่า',
        nameEn:    'Luang Phu Suk',
        templeTh:  'วัดปากคลองมะขามเฒ่า',
        templeEn:  'Wat Pak Khlong Makham Thao',
        province:  'ชัยนาท',
        birthYear: 2390,
        deathYear: 2466,
        isFamous:  true,
        coinCount: 43,
      },
    }),
    prisma.monk.upsert({
      where:  { id: 'monk-lp-sothon' },
      update: {},
      create: {
        id:        'monk-lp-sothon',
        nameTh:    'หลวงพ่อโสธร',
        nameEn:    'Luang Pho Sothon',
        templeTh:  'วัดโสธรวรารามวรวิหาร',
        templeEn:  'Wat Sothon Wararam',
        province:  'ฉะเชิงเทรา',
        isFamous:  true,
        coinCount: 119,
      },
    }),
  ])

  console.log(`✅ Seeded ${monks.length} monks`)
  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Next steps:')
  console.log('   1. Set DATABASE_URL and DIRECT_URL in .env.local')
  console.log('   2. Run: npx prisma migrate dev --name init')
  console.log('   3. Run: npx prisma db seed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
