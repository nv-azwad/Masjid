import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  let password = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }
  return password
}

async function main() {
  // Clear existing data
  await prisma.pendingChange.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.imam.deleteMany()
  await prisma.jummahSetting.deleteMany()
  await prisma.prayer.deleteMany()
  await prisma.mosque.deleteMany()
  await prisma.user.deleteMany()

  // Generate secure passwords
  const adminPass = generatePassword()
  const modPass = generatePassword()

  // Create admin user
  const adminPassword = await bcrypt.hash(adminPass, 12)
  await prisma.user.create({
    data: {
      username: 'admin_tt',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      recoveryEmail: process.env.RECOVERY_EMAIL || null,
    },
  })

  // Create moderator user
  const modPassword = await bcrypt.hash(modPass, 12)
  await prisma.user.create({
    data: {
      username: 'mod_tt',
      password: modPassword,
      name: 'Moderator',
      role: 'MODERATOR',
    },
  })

  // Mosque info
  await prisma.mosque.create({
    data: {
      name: 'Gausul Azam Jameh Masjid',
      address: 'Road 9, Sector 13, Uttara, Dhaka',
      phone: '',
      email: '',
    },
  })

  // Prayer times
  const prayers = [
    { name: 'Fajr', adhan: '5:00 AM', time: '5:15 AM', isNext: true, order: 1 },
    { name: 'Dhuhr', adhan: '12:15 PM', time: '12:30 PM', isNext: false, order: 2 },
    { name: 'Asr', adhan: '3:45 PM', time: '4:00 PM', isNext: false, order: 3 },
    { name: 'Maghrib', adhan: '6:05 PM', time: '6:10 PM', isNext: false, order: 4 },
    { name: 'Isha', adhan: '7:15 PM', time: '7:30 PM', isNext: false, order: 5 },
  ]

  for (const prayer of prayers) {
    await prisma.prayer.create({ data: prayer })
  }

  // Jummah setting
  await prisma.jummahSetting.create({
    data: {
      name: 'Friday Jummah',
      time: '1:15 PM',
      khateeb: 'Sheikh Ibrahim Ahmed',
    },
  })

  // Imams
  const imams = [
    {
      name: 'Imam Abdullah Rahman',
      role: 'Head Imam',
      bio: 'Served the community for over 15 years with dedication to Islamic education and spiritual guidance.',
      contact: 'imam.abdullah@gausulazam.org',
      order: 1,
    },
    {
      name: 'Imam Muhammad Ali',
      role: 'Associate Imam',
      bio: 'Specializes in Quran recitation and teaches Islamic studies to youth and adults.',
      contact: 'imam.muhammad@gausulazam.org',
      order: 2,
    },
  ]

  for (const imam of imams) {
    await prisma.imam.create({ data: imam })
  }

  console.log('')
  console.log('='.repeat(60))
  console.log('  DATABASE SEEDED SUCCESSFULLY')
  console.log('='.repeat(60))
  console.log('')
  console.log('  SAVE THESE CREDENTIALS — they will NOT be shown again!')
  console.log('')
  console.log(`  Admin:     admin_tt`)
  console.log(`  Password:  ${adminPass}`)
  console.log('')
  console.log(`  Moderator: mod_tt`)
  console.log(`  Password:  ${modPass}`)
  console.log('')
  console.log('  Change these passwords after first login.')
  console.log('='.repeat(60))
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
