import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Memora...');

  // Clean existing data
  await prisma.sessionLog.deleteMany();
  await prisma.mediaUpload.deleteMany();
  await prisma.memoryOption.deleteMany();
  await prisma.memoryOrb.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  // 1. Create Family Group
  const family = await prisma.family.create({
    data: {
      familyName: 'ครอบครัววัฒนศิริ',
      familyCode: 'MEMORA-8821',
    },
  });

  console.log(`Created Family: ${family.familyName} (${family.familyCode})`);

  // 2. Hash Password for Demo Users
  const passwordHash = await bcrypt.hash('memora123', 10);

  // 3. Create Demo Users & Family Members
  // Grandma Somsri (Elder)
  const userGrandma = await prisma.user.create({
    data: {
      email: 'grandma@memora.app',
      passwordHash,
      name: 'สมศรี วัฒนศิริ',
      role: 'elder',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      familyId: family.id,
    },
  });

  const memberGrandma = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: userGrandma.id,
      name: 'สมศรี',
      role: 'elder',
      relationTitle: 'คุณยาย',
      avatarIcon: 'heart',
      avatarColor: 'bg-rose-500 text-white',
      isCurrentActive: true,
      birthYear: 1952,
    },
  });

  // Grandpa Somchai (Elder)
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: 'สมชาย',
      role: 'elder',
      relationTitle: 'คุณตา',
      avatarIcon: 'sparkles',
      avatarColor: 'bg-amber-500 text-white',
      isCurrentActive: false,
      birthYear: 1948,
    },
  });

  // Daughter Ann (Relative)
  const userAnn = await prisma.user.create({
    data: {
      email: 'ann@memora.app',
      passwordHash,
      name: 'แอน วัฒนศิริ',
      role: 'relative',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      familyId: family.id,
    },
  });

  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: userAnn.id,
      name: 'แอน',
      role: 'relative',
      relationTitle: 'ลูกสาวคนโต',
      avatarIcon: 'user',
      avatarColor: 'bg-indigo-500 text-white',
      isCurrentActive: false,
    },
  });

  // Grandson Poom (Relative)
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: 'ภูมิ',
      role: 'relative',
      relationTitle: 'หลานชายคนโปรด',
      avatarIcon: 'shield',
      avatarColor: 'bg-emerald-500 text-white',
      isCurrentActive: false,
    },
  });

  // Granddaughter Mint (Relative)
  await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: 'มินท์',
      role: 'relative',
      relationTitle: 'หลานสาวคนเล็ก',
      avatarIcon: 'star',
      avatarColor: 'bg-sky-500 text-white',
      isCurrentActive: false,
    },
  });

  console.log('Created Family Members & Users');

  // 4. Create Initial 5 Memory Orbs
  const orbsData = [
    {
      emotion: 'joy',
      title: 'รอยยิ้มหลานชายตัวน้อย',
      titleEn: 'Grandson’s Cheerful Smile',
      description: 'พาน้องภูมิ หลานชายคนโปรดไปวิ่งเล่นที่สนามเด็กเล่น สวมเสื้อยืดสีส้มสดใส วิ่งเล่นชิงช้าและหัวเราะร่าเริงอย่างมีความสุขตลอดช่วงบ่าย',
      descriptionEn: 'Taking grandson Poom to run around the playground, swinging happily and laughing with joy under the warm afternoon sun.',
      memoryYear: 'พ.ศ. 2567 (สนามเด็กเล่น)',
      memoryYearEn: '2024 (Playground Park)',
      photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=800&q=80',
      voicePrompt: 'จำลูกแก้วความทรงจำลูกนี้ได้ไหมคะ... หลานชายคนโปรดที่กำลังวิ่งเล่นอยู่ตรงนี้ ชื่ออะไรเอ่ย?',
      voicePromptEn: 'Do you remember this golden memory orb? Who is this favorite grandson playing in the park?',
      voiceSuccess: 'เก่งมากเลยค่ะ! ถูกต้องแล้วค่ะ นี่คือน้องภูมิ หลานชายคนโปรดของคุณเองค่ะ!',
      voiceSuccessEn: 'Wonderful! You got it right! That is your favorite grandson, Poom!',
      gentleClue: 'ใบ้ให้นะคะ... หลานชายคนที่ชอบมาอ้อนขอกินไอศกรีมกะทิบ่อยๆ ไงคะ',
      gentleClueEn: 'Here is a warm clue... He always asks for sweet coconut ice cream!',
      correctAnswer: 'น้องภูมิ (หลานชาย)',
      correctAnswerEn: 'Poom (Grandson)',
      glowColor: 'rgba(245, 158, 11, 0.45)',
      accentBg: 'from-amber-400 via-amber-300 to-yellow-200',
      isUnlocked: true,
      uploadedBy: 'น้องแอน (ลูกสาว)',
      uploadedByEn: 'Ann (Daughter)',
      uploadDate: 'วันนี้ 09:15 น.',
      uploadDateEn: 'Today at 09:15 AM',
      options: [
        {
          label: 'น้องภูมิ',
          labelEn: 'Poom',
          relation: 'หลานชายคนโต',
          relationEn: 'Eldest Grandson',
          photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
          isCorrect: true,
        },
        {
          label: 'น้องบาส',
          labelEn: 'Bas',
          relation: 'หลานข้างบ้าน',
          relationEn: 'Neighbor’s Child',
          photoUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          label: 'น้องนนท์',
          labelEn: 'Non',
          relation: 'ลูกพี่ลูกน้อง',
          relationEn: 'Cousin',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    },
    {
      emotion: 'nostalgia',
      title: 'ทริปครอบครัวรับลมหนาวเชียงใหม่',
      titleEn: 'Winter Trip to Chiang Mai',
      description: 'ทริปขึ้นดอยอินทนนท์เมื่อ 5 ปีก่อน อากาศหนาว 12 องศา ทุกคนใส่เสื้อกันหนาวไหมพรมสีแดงถ่ายรูปคู่กับสวนดอกไม้เมืองหนาว',
      descriptionEn: 'Family road trip up Doi Inthanon 5 years ago. A crisp 12°C morning surrounded by blossoming hydrangeas and warm smiles.',
      memoryYear: 'พ.ศ. 2562 (ดอยอินทนนท์)',
      memoryYearEn: '2019 (Doi Inthanon, Chiang Mai)',
      photoUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
      voicePrompt: 'ทริปท่องเที่ยวที่อากาศเย็นสบาย มีสวนดอกไม้สีสวยที่คุณยายชอบมากนี้ ไปเที่ยวที่จังหวัดไหนนะคะ?',
      voicePromptEn: 'Which beautiful province was this cool winter family road trip with colorful flowers?',
      voiceSuccess: 'ยอดเยี่ยมที่สุดค่ะ! ทริปเชียงใหม่ดอยอินทนนท์ ที่ทุกคนกินสตรอว์เบอร์รีหวานฉ่ำด้วยกันค่ะ!',
      voiceSuccessEn: 'Excellent! Chiang Mai trip to Doi Inthanon, eating fresh strawberries together!',
      gentleClue: 'ใบ้ให้นะคะ... เมืองเหนือที่พวกเราแวะกินไส้อั่วและน้ำพริกหนุ่มแสนอร่อยไงคะ',
      gentleClueEn: 'Hint: In Northern Thailand where we had delicious Northern sausages and warm tea!',
      correctAnswer: 'จังหวัดเชียงใหม่ (ดอยอินทนนท์)',
      correctAnswerEn: 'Chiang Mai Province',
      glowColor: 'rgba(2, 132, 199, 0.45)',
      accentBg: 'from-sky-400 via-sky-300 to-blue-200',
      isUnlocked: true,
      uploadedBy: 'น้องแอน (ลูกสาว)',
      uploadedByEn: 'Ann (Daughter)',
      uploadDate: 'เมื่อวานนี้ 18:30 น.',
      uploadDateEn: 'Yesterday at 06:30 PM',
      options: [
        {
          label: 'จังหวัดเชียงใหม่',
          labelEn: 'Chiang Mai',
          relation: 'ดอยอินทนนท์',
          relationEn: 'Doi Inthanon Mountain',
          photoUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=400&q=80',
          isCorrect: true,
        },
        {
          label: 'จังหวัดภูเก็ต',
          labelEn: 'Phuket',
          relation: 'หาดกะตะ',
          relationEn: 'Kata Beach',
          photoUrl: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          label: 'จังหวัดนครราชสีมา',
          labelEn: 'Nakhon Ratchasima',
          relation: 'เขาใหญ่',
          relationEn: 'Khao Yai National Park',
          photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    },
    {
      emotion: 'love',
      title: 'วันเกิดครบรอบ 70 ปีของคุณยาย',
      titleEn: 'Grandma’s 70th Birthday Feast',
      description: 'ลูกหลานทุกคนมารวมตัวกันครบหน้า เป่าเค้กวานิลลาผลไม้สดรูปหัวใจที่หลานๆ ร่วมกันทำ และกอดหอมคุณยายทีละคน',
      descriptionEn: 'Surprise 70th birthday gathering! All children and grandchildren gathered around a handmade vanilla cake, hugging Grandma with deep warmth.',
      memoryYear: 'พ.ศ. 2565 (ห้องนั่งเล่นที่บ้าน)',
      memoryYearEn: '2022 (Home Living Room)',
      photoUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      voicePrompt: 'งานเลี้ยงแสนอบอุ่นที่มีเค้กผลไม้ก้อนโตนี้ เป็นงานฉลองวันเกิดครบรอบกี่ปีของคุณยายคะ?',
      voicePromptEn: 'Which milestone birthday celebration was this loving evening with the homemade strawberry cake?',
      voiceSuccess: 'ถูกต้องแล้วค่ะ! วันเกิดครบรอบ 70 ปีที่คุณยายยิ้มกว้างที่สุดในบ้านเลยค่ะ!',
      voiceSuccessEn: 'Spot on! Your 70th birthday milestone surrounded by warm family hugs!',
      gentleClue: 'ใบ้ให้นะคะ... เทียนบนเค้กมีเลข 7 นำหน้า และเป็นปีที่น้องมินท์เริ่มเข้ามหาวิทยาลัยค่ะ',
      gentleClueEn: 'Hint: The candle starts with number 7, the same year granddaughter Mint entered college!',
      correctAnswer: 'วันเกิดครบรอบ 70 ปี',
      correctAnswerEn: '70th Birthday Anniversary',
      glowColor: 'rgba(225, 29, 72, 0.45)',
      accentBg: 'from-rose-400 via-rose-300 to-pink-200',
      isUnlocked: true,
      uploadedBy: 'น้องภูมิ (หลานชาย)',
      uploadedByEn: 'Poom (Grandson)',
      uploadDate: '3 วันที่แล้ว',
      uploadDateEn: '3 days ago',
      options: [
        {
          label: 'ครบรอบ 70 ปี',
          labelEn: '70th Birthday',
          relation: 'เลข 7 มหามงคล',
          relationEn: 'Lucky 70 Milestone',
          photoUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
          isCorrect: true,
        },
        {
          label: 'ครบรอบ 65 ปี',
          labelEn: '65th Birthday',
          relation: 'วัยเกษียณ',
          relationEn: 'Early Retirement',
          photoUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          label: 'ครบรอบ 75 ปี',
          labelEn: '75th Birthday',
          relation: 'เพชรน้ำหนึ่ง',
          relationEn: 'Diamond Age',
          photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    },
    {
      emotion: 'vitality',
      title: 'เจ้าพุดเดิ้ลน้อย "เฉาก๊วย"',
      titleEn: 'Playful Poodle “Chao-Kuay”',
      description: 'เจ้าหมาน้อยขนฟูสีดำที่ชอบวิ่งมาคาบรองเท้าแตะของคุณยายไปซ่อน แล้ววิ่งวนรอบสนามหญ้าอย่างซุกซน',
      descriptionEn: 'The fluffy black poodle Chao-Kuay who lovingly steals Grandma’s soft slippers and dashes playfully across the sunny garden lawn.',
      memoryYear: 'พ.ศ. 2566 (สวนหน้าบ้าน)',
      memoryYearEn: '2023 (Front Garden Lawn)',
      photoUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80',
      voicePrompt: 'เจ้าหมาน้อยขนฟูสีดำตัวโปรดที่ชอบมานอนหนุนตักคุณยาย ชื่ออะไรเอ่ย?',
      voicePromptEn: 'What is the playful name of this loyal little black poodle who loves napping on your lap?',
      voiceSuccess: 'เก่งมากเลยค่ะ! เจ้าเฉาก๊วยตัวแสบที่ชอบวิ่งมารอคุณยายตื่นทุกเช้านั่นเองค่ะ!',
      voiceSuccessEn: 'You got it! Chao-Kuay the mischievous poodle who greets you every morning!',
      gentleClue: 'ใบ้ให้นะคะ... ชื่อขนมหวานสีดำใส่น้ำแข็งหวานเย็นชื่นใจไงคะ',
      gentleClueEn: 'Hint: Named after the famous refreshing Thai black grass jelly dessert!',
      correctAnswer: 'เจ้าเฉาก๊วย (หมาพุดเดิ้ล)',
      correctAnswerEn: 'Chao-Kuay (Poodle)',
      glowColor: 'rgba(16, 185, 129, 0.45)',
      accentBg: 'from-emerald-400 via-emerald-300 to-teal-200',
      isUnlocked: false,
      uploadedBy: 'น้องแอน (ลูกสาว)',
      uploadedByEn: 'Ann (Daughter)',
      uploadDate: 'สัปดาห์ที่แล้ว',
      uploadDateEn: 'Last week',
      options: [
        {
          label: 'เจ้าเฉาก๊วย',
          labelEn: 'Chao-Kuay',
          relation: 'สุนัขตัวโปรด',
          relationEn: 'Beloved Family Pet',
          photoUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
          isCorrect: true,
        },
        {
          label: 'เจ้าบราวนี่',
          labelEn: 'Brownie',
          relation: 'สุนัขข้างบ้าน',
          relationEn: 'Neighbor’s Dog',
          photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          label: 'เจ้านมสด',
          labelEn: 'Nom-Sod',
          relation: 'แมวเปอร์เซีย',
          relationEn: 'Persian Cat',
          photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    },
    {
      emotion: 'celebration',
      title: 'วันรับปริญญาน้องแอน เกียรตินิยม',
      titleEn: 'Ann’s University Graduation Day',
      description: 'วันที่น้องแอน ลูกสาวคนโตสวมชุดครุยวิทยฐานะ คว้าเหรียญเกียรตินิยมมาให้คุณยายได้ภาคภูมิใจ น้ำตาซึมด้วยความปลื้มใจ',
      descriptionEn: 'Daughter Ann’s proud graduation day! Wearing her ceremonial academic gown and holding honors medal, hugging Grandma with tears of sheer joy.',
      memoryYear: 'พ.ศ. 2555 (หอประชุมใหญ่)',
      memoryYearEn: '2012 (Grand Auditorium Hall)',
      photoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
      voicePrompt: 'วันแห่งความภาคภูมิใจในรูปนี้ เป็นวันสำคัญอะไรของลูกสาวคนโตนะคะ?',
      voicePromptEn: 'Which unforgettable proud milestone was this for your eldest daughter Ann?',
      voiceSuccess: 'ถูกต้องที่สุดค่ะ! วันรับปริญญาเกียรตินิยมของน้องแอน วันที่คุณยายยิ้มภูมิใจที่สุดเลยค่ะ!',
      voiceSuccessEn: 'Spot on! Daughter Ann’s university graduation with first-class honors!',
      gentleClue: 'ใบ้ให้นะคะ... วันที่น้องแอนใส่ชุดครุยสีดำแถบทอง และพวกเรามอบช่อดอกทานตะวันช่อใหญ่ให้ค่ะ',
      gentleClueEn: 'Hint: She wore a formal black gown and you handed her a bright sunflower bouquet!',
      correctAnswer: 'วันรับปริญญาของน้องแอน',
      correctAnswerEn: 'Ann’s Graduation Day',
      glowColor: 'rgba(139, 92, 246, 0.45)',
      accentBg: 'from-violet-400 via-violet-300 to-purple-200',
      isUnlocked: false,
      uploadedBy: 'น้องแอน (ลูกสาว)',
      uploadedByEn: 'Ann (Daughter)',
      uploadDate: '2 สัปดาห์ที่แล้ว',
      uploadDateEn: '2 weeks ago',
      options: [
        {
          label: 'วันรับปริญญา',
          labelEn: 'Graduation Day',
          relation: 'เกียรตินิยมอันดับ 1',
          relationEn: 'First-Class Honors',
          photoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=400&q=80',
          isCorrect: true,
        },
        {
          label: 'วันเปิดร้านกาแฟ',
          labelEn: 'Cafe Opening',
          relation: 'ธุรกิจครอบครัว',
          relationEn: 'Family Business',
          photoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
        {
          label: 'วันแต่งงาน',
          labelEn: 'Wedding Day',
          relation: 'มงคลสมรส',
          relationEn: 'Wedding Ceremony',
          photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
          isCorrect: false,
        },
      ],
    },
  ];

  for (const orb of orbsData) {
    const { options, ...orbCore } = orb;
    await prisma.memoryOrb.create({
      data: {
        ...orbCore,
        familyId: family.id,
        targetElderId: memberGrandma.id,
        options: {
          create: options,
        },
      },
    });
  }

  console.log(`Created ${orbsData.length} Memory Orbs with cognitive options!`);

  // 5. Create initial session log
  await prisma.sessionLog.create({
    data: {
      familyId: family.id,
      elderId: memberGrandma.id,
      completedOrbs: 3,
      totalOrbs: 5,
      streakDays: 14,
      averageSpeedSec: 11.4,
      overallMood: 'ความสุขเบ่งบาน',
      lineSent: true,
      lineSentAt: new Date(),
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
