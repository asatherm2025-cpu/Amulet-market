-- ============================================================
-- SIAM COIN — Seed Data (ข้อมูลตัวอย่าง)
-- ============================================================

-- ============================================================
-- MONKS (เกจิอาจารย์ชื่อดัง)
-- ============================================================
INSERT INTO public.monks (id, name_th, name_en, temple_th, temple_en, province, birth_year, death_year, is_famous) VALUES
(
  'a1000001-0000-0000-0000-000000000001',
  'หลวงปู่ทวด เหยียบน้ำทะเลจืด',
  'Luang Phu Thuat',
  'วัดช้างให้',
  'Wat Chang Hai',
  'ปัตตานี',
  2125, 2225,
  TRUE
),
(
  'a1000001-0000-0000-0000-000000000002',
  'หลวงพ่อโสธร',
  'Luang Pho Sothon',
  'วัดโสธรวรารามวรวิหาร',
  'Wat Sothon Wararam',
  'ฉะเชิงเทรา',
  NULL, NULL,
  TRUE
),
(
  'a1000001-0000-0000-0000-000000000003',
  'หลวงปู่ศุข วัดปากคลองมะขามเฒ่า',
  'Luang Phu Suk',
  'วัดปากคลองมะขามเฒ่า',
  'Wat Pak Khlong Makham Thao',
  'ชัยนาท',
  2390, 2466,
  TRUE
),
(
  'a1000001-0000-0000-0000-000000000004',
  'หลวงพ่อเงิน วัดบางคลาน',
  'Luang Pho Ngern',
  'วัดบางคลาน',
  'Wat Bang Khlan',
  'พิจิตร',
  2353, 2462,
  TRUE
),
(
  'a1000001-0000-0000-0000-000000000005',
  'หลวงปู่โต พรหมรังสี',
  'Somdej Toh',
  'วัดระฆังโฆสิตาราม',
  'Wat Rakhang',
  'กรุงเทพมหานคร',
  2331, 2415,
  TRUE
),
(
  'a1000001-0000-0000-0000-000000000006',
  'หลวงพ่อคูณ ปริสุทโธ',
  'Luang Pho Khun',
  'วัดบ้านไร่',
  'Wat Ban Rai',
  'นครราชสีมา',
  2466, 2558,
  TRUE
);

-- ============================================================
-- COINS (เหรียญตัวอย่าง)
-- ============================================================
INSERT INTO public.coins (
  id, title_th, title_en, title_zh,
  monk_id, monk_name_th, monk_name_en,
  temple_th, temple_en, province,
  year_th, year_ce,
  material_th, material_en,
  size_mm, weight_gram,
  condition, price_thb,
  images, is_authenticated, status,
  description_th, description_en,
  seller_id, view_count
) VALUES
-- เหรียญหลวงปู่ทวด
(
  'c0000001-0000-0000-0000-000000000001',
  'เหรียญหลวงปู่ทวด รุ่นเจริญพร ปี 2515',
  'Luang Phu Thuat Charoen Porn Edition 1972',
  '龙婆托 祈福版 1972年',
  'a1000001-0000-0000-0000-000000000001',
  'หลวงปู่ทวด',
  'Luang Phu Thuat',
  'วัดช้างให้',
  'Wat Chang Hai',
  'ปัตตานี',
  2515, 1972,
  'เนื้อทองแดงรมดำ',
  'Copper (Dark Patina)',
  26.0, 8.5,
  4, 2500,
  ARRAY[
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400',
    'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400'
  ],
  TRUE, 'available',
  'เหรียญหลวงปู่ทวด รุ่นเจริญพร สร้างในปี พ.ศ. 2515 เนื้อทองแดงรมดำ สภาพสวยงาม',
  'Luang Phu Thuat Charoen Porn edition coin, made in 1972. Copper with dark patina. Very good condition.',
  '00000000-0000-0000-0000-000000000001',
  142
),
(
  'c0000001-0000-0000-0000-000000000002',
  'เหรียญหลวงปู่ทวด รุ่นแรก ปี 2497',
  'Luang Phu Thuat First Edition 1954',
  '龙婆托 首版 1954年',
  'a1000001-0000-0000-0000-000000000001',
  'หลวงปู่ทวด',
  'Luang Phu Thuat',
  'วัดช้างให้',
  'Wat Chang Hai',
  'ปัตตานี',
  2497, 1954,
  'เนื้ออัลปาก้า',
  'Alpaca Metal',
  25.0, 7.8,
  3, 18500,
  ARRAY[
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400'
  ],
  TRUE, 'available',
  'เหรียญหลวงปู่ทวด รุ่นแรก ปี 2497 หายากมาก สภาพตามอายุ',
  'First edition Luang Phu Thuat coin from 1954. Very rare. Condition as expected for age.',
  '00000000-0000-0000-0000-000000000001',
  387
),
-- เหรียญหลวงพ่อเงิน
(
  'c0000001-0000-0000-0000-000000000003',
  'เหรียญหลวงพ่อเงิน วัดบางคลาน รุ่นสาม',
  'Luang Pho Ngern Wat Bang Khlan 3rd Edition',
  '龙婆鹰 3rd版',
  'a1000001-0000-0000-0000-000000000004',
  'หลวงพ่อเงิน',
  'Luang Pho Ngern',
  'วัดบางคลาน',
  'Wat Bang Khlan',
  'พิจิตร',
  2460, 1917,
  'เนื้อเงิน',
  'Silver',
  22.0, 5.2,
  3, 45000,
  ARRAY[
    'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400'
  ],
  TRUE, 'available',
  'เหรียญหลวงพ่อเงิน รุ่นสาม ปี 2460 เนื้อเงินแท้ หายากมาก',
  'Luang Pho Ngern 3rd edition silver coin from 1917. Genuine silver. Very rare.',
  '00000000-0000-0000-0000-000000000001',
  521
),
-- เหรียญหลวงพ่อคูณ
(
  'c0000001-0000-0000-0000-000000000004',
  'เหรียญหลวงพ่อคูณ รุ่นคูณทวี ปี 2536',
  'Luang Pho Khun Khun Thawi Edition 1993',
  '龙婆坤 1993年',
  'a1000001-0000-0000-0000-000000000006',
  'หลวงพ่อคูณ',
  'Luang Pho Khun',
  'วัดบ้านไร่',
  'Wat Ban Rai',
  'นครราชสีมา',
  2536, 1993,
  'เนื้อทองแดง',
  'Copper',
  29.0, 10.2,
  5, 3800,
  ARRAY[
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400',
    'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400'
  ],
  TRUE, 'available',
  'เหรียญหลวงพ่อคูณ รุ่นคูณทวี ปี 2536 สภาพสวยมากเหมือนใหม่',
  'Luang Pho Khun Khun Thawi edition 1993. Mint condition.',
  '00000000-0000-0000-0000-000000000001',
  298
),
-- เหรียญสมเด็จโต
(
  'c0000001-0000-0000-0000-000000000005',
  'เหรียญสมเด็จโต วัดระฆัง รุ่นอนุสรณ์ 100 ปี',
  'Somdej Toh Wat Rakhang 100th Anniversary',
  '颂德大和尚 百年纪念版',
  'a1000001-0000-0000-0000-000000000005',
  'สมเด็จโต พรหมรังสี',
  'Somdej Toh',
  'วัดระฆังโฆสิตาราม',
  'Wat Rakhang',
  'กรุงเทพมหานคร',
  2515, 1972,
  'เนื้อทองแดงผิวไฟ',
  'Copper (Fire Finish)',
  30.0, 11.5,
  4, 8500,
  ARRAY[
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=400'
  ],
  TRUE, 'available',
  'เหรียญสมเด็จโต รุ่นอนุสรณ์ 100 ปี วัดระฆัง สภาพดีมาก',
  'Somdej Toh 100th anniversary commemorative coin from Wat Rakhang. Very good condition.',
  '00000000-0000-0000-0000-000000000001',
  445
),
-- เหรียญหลวงปู่ศุข
(
  'c0000001-0000-0000-0000-000000000006',
  'เหรียญหลวงปู่ศุข วัดปากคลอง รุ่นแรก',
  'Luang Phu Suk Wat Pak Khlong 1st Edition',
  '龙婆素 首版',
  'a1000001-0000-0000-0000-000000000003',
  'หลวงปู่ศุข',
  'Luang Phu Suk',
  'วัดปากคลองมะขามเฒ่า',
  'Wat Pak Khlong Makham Thao',
  'ชัยนาท',
  2466, 1923,
  'เนื้อเงิน',
  'Silver',
  23.0, 6.1,
  3, 32000,
  ARRAY[
    'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400'
  ],
  TRUE, 'available',
  'เหรียญหลวงปู่ศุข รุ่นแรก เนื้อเงิน หายากมาก ประมาณ 100 ปี',
  'Luang Phu Suk first edition silver coin. Approximately 100 years old. Very rare.',
  '00000000-0000-0000-0000-000000000001',
  189
);

-- ============================================================
-- PRICE HISTORY (ประวัติราคาสำหรับ chart)
-- ============================================================
INSERT INTO public.price_history (coin_tag, price_thb, source, recorded_at) VALUES
-- หลวงปู่ทวด รุ่นเจริญพร
('lp-thuat-charoen-porn', 800,  'marketplace', '2020-01-01'),
('lp-thuat-charoen-porn', 950,  'marketplace', '2020-07-01'),
('lp-thuat-charoen-porn', 1100, 'marketplace', '2021-01-01'),
('lp-thuat-charoen-porn', 1400, 'auction',     '2021-07-01'),
('lp-thuat-charoen-porn', 1600, 'marketplace', '2022-01-01'),
('lp-thuat-charoen-porn', 1900, 'marketplace', '2022-07-01'),
('lp-thuat-charoen-porn', 2100, 'auction',     '2023-01-01'),
('lp-thuat-charoen-porn', 2300, 'marketplace', '2023-07-01'),
('lp-thuat-charoen-porn', 2500, 'marketplace', '2024-01-01'),
('lp-thuat-charoen-porn', 2500, 'marketplace', '2025-01-01'),
-- หลวงพ่อเงิน รุ่นสาม
('lp-ngern-3rd',  15000, 'auction',     '2020-01-01'),
('lp-ngern-3rd',  18000, 'auction',     '2021-01-01'),
('lp-ngern-3rd',  22000, 'marketplace', '2022-01-01'),
('lp-ngern-3rd',  28000, 'auction',     '2023-01-01'),
('lp-ngern-3rd',  38000, 'auction',     '2024-01-01'),
('lp-ngern-3rd',  45000, 'marketplace', '2025-01-01');
