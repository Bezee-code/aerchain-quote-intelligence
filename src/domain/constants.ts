export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  CNY: 0.14,
  JPY: 0.0067,
  INR: 0.012,
};

export const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  EA: { EA: 1, PC: 1, SET: 1 },
  PC: { EA: 1, PC: 1, SET: 1 },
  SET: { EA: 1, PC: 1, SET: 1 },
  KG: { KG: 1, TON: 0.001 },
  TON: { KG: 1000, TON: 1 },
  M: { M: 1, M2: 1, M3: 1 },
  M2: { M: 1, M2: 1 },
  M3: { M: 1, M3: 1 },
  HR: { HR: 1 },
  L: { L: 1 },
};

export const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/tiff': 'image',
  'message/rfc822': 'email',
  'application/vnd.ms-outlook': 'email',
} as const;

export const QUESTIONNAIRE_QUESTIONS = [
  {
    id: 'q1',
    question: 'Is the vendor ISO 9001 certified?',
    type: 'boolean' as const,
    required: true,
    disqualifyIfFalse: true,
  },
  {
    id: 'q2',
    question: 'What is the delivery lead time in days?',
    type: 'number' as const,
    required: true,
    maxValue: 14,
    disqualifyIfExceeds: true,
  },
  {
    id: 'q3',
    question: 'Does the vendor have monthly converting capacity of at least 500 MT?',
    type: 'boolean' as const,
    required: true,
    disqualifyIfFalse: true,
  },
  {
    id: 'q4',
    question: 'Does the vendor comply with quality/environmental certification (FSC / RoHS)?',
    type: 'boolean' as const,
    required: false,
  },
  {
    id: 'q5',
    question: 'Does the vendor accept commercial credit payment terms (Net 30 / Net 60)?',
    type: 'boolean' as const,
    required: true,
    disqualifyIfFalse: true,
  },
] as const;

export const RFX_SEED = {
  id: 'rfx-001',
  name: 'Corrugated Packaging Annual Procurement 2026',
  description: 'Annual corporate procurement for corrugated shipping boxes, die-cut mailers, heavy-duty export shippers, and protective fitments',
  lineItems: [
    { id: 'li-001', lineNumber: 1, description: 'RSC 3-Ply Box 200x150x100mm', specification: '3-Ply Single Wall, B-Flute, 120K/100F/120T, Burst Factor 16, Plain Unprinted', quantity: 50000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-002', lineNumber: 2, description: 'RSC 3-Ply Box 250x200x150mm', specification: '3-Ply Single Wall, C-Flute, 140K/120F/140K, Burst Factor 18, 1-Color Flexo Print', quantity: 40000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-003', lineNumber: 3, description: 'RSC 3-Ply Box 300x250x200mm', specification: '3-Ply Single Wall, C-Flute, 150K/120F/150T, BF 20, 2-Color Flexo Print', quantity: 35000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-004', lineNumber: 4, description: 'RSC 3-Ply Box 350x300x250mm', specification: '3-Ply Single Wall, B-Flute, 180K/120F/150K, ECT 32, Plain Brown', quantity: 25000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-005', lineNumber: 5, description: 'RSC 3-Ply Box 400x300x200mm', specification: '3-Ply Single Wall, C-Flute, 150K/120F/150K, BF 18, 1-Color Print', quantity: 30000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-006', lineNumber: 6, description: 'RSC 3-Ply Box 450x350x300mm', specification: '3-Ply Single Wall, C-Flute, 180K High-Burst/140F/180K, BF 22, Plain', quantity: 20000, unit: 'EA' as const, category: 'Standard RSC 3-Ply', mandatory: true },
    { id: 'li-007', lineNumber: 7, description: 'RSC 5-Ply Heavy Box 300x250x250mm', specification: '5-Ply Double Wall, BC-Flute, 180K/120F/140T/120F/180K, Burst Strength 12 kg/cm2, Plain', quantity: 15000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-008', lineNumber: 8, description: 'RSC 5-Ply Heavy Box 400x300x300mm', specification: '5-Ply Double Wall, BC-Flute, 180K/140F/150K/140F/180K, Burst Strength 14 kg/cm2, 2-Color Flexo', quantity: 20000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-009', lineNumber: 9, description: 'RSC 5-Ply Heavy Box 450x400x350mm', specification: '5-Ply Double Wall, BC-Flute, 200K/140F/150K/140F/200K, Burst Strength 16 kg/cm2, 2-Color Flexo', quantity: 18000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-010', lineNumber: 10, description: 'RSC 5-Ply Heavy Box 500x400x400mm', specification: '5-Ply Double Wall, BC-Flute, 200K/150F/180K/150F/200K, ECT 48, 1-Color Print', quantity: 12000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-011', lineNumber: 11, description: 'RSC 5-Ply Heavy Box 600x400x400mm', specification: '5-Ply Double Wall, BC-Flute, 230K/150F/180K/150F/230K, Burst Strength 18 kg/cm2, Plain', quantity: 10000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-012', lineNumber: 12, description: 'RSC 5-Ply Heavy Box 600x500x500mm', specification: '5-Ply Double Wall, BC-Flute, 250K/150F/200K/150F/250K, Burst Strength 20 kg/cm2, 2-Color Flexo', quantity: 8000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-013', lineNumber: 13, description: 'RSC 5-Ply Export Shipper 700x500x400mm', specification: '5-Ply Double Wall, BC-Flute, Water-Resistant Coating, 250K/160F/200K/160F/250K, ECT 55', quantity: 6000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-014', lineNumber: 14, description: 'RSC 5-Ply Export Shipper 800x600x500mm', specification: '5-Ply Double Wall, BC-Flute, Heavy Export Grade, 280K/160F/230K/160F/280K, ECT 60, 1-Color Print', quantity: 5000, unit: 'EA' as const, category: 'Heavy Duty 5-Ply', mandatory: true },
    { id: 'li-015', lineNumber: 15, description: 'RSC 7-Ply Triple Wall Box 600x500x500mm', specification: '7-Ply Triple Wall, AAC-Flute, 300K/160F/250K/160F/250K/160F/300K, Burst Strength 28 kg/cm2', quantity: 3000, unit: 'EA' as const, category: 'Heavy Duty 7-Ply', mandatory: true },
    { id: 'li-016', lineNumber: 16, description: 'RSC 7-Ply Triple Wall Box 800x600x600mm', specification: '7-Ply Triple Wall, AAC-Flute, 350K/180F/250K/180F/250K/180F/350K, Burst Strength 32 kg/cm2', quantity: 2500, unit: 'EA' as const, category: 'Heavy Duty 7-Ply', mandatory: true },
    { id: 'li-017', lineNumber: 17, description: 'RSC 7-Ply Bulk Master Carton 1000x800x700mm', specification: '7-Ply Triple Wall, Heavy Industrial, 350K/180F/300K/180F/300K/180F/350K, BCT 1800 kgf', quantity: 1500, unit: 'EA' as const, category: 'Heavy Duty 7-Ply', mandatory: true },
    { id: 'li-018', lineNumber: 18, description: 'Die-Cut Mailer Box 180x120x60mm', specification: '3-Ply Micro E-Flute, 150 GSM White Top Liner/120F/150K, Self-Locking Tab, 4-Color Flexo', quantity: 45000, unit: 'EA' as const, category: 'Die-Cut Mailers', mandatory: true },
    { id: 'li-019', lineNumber: 19, description: 'Die-Cut Mailer Box 240x160x80mm', specification: '3-Ply Micro E-Flute, 180 GSM White Top Liner/120F/150K, Self-Locking Tab, 2-Color Print', quantity: 35000, unit: 'EA' as const, category: 'Die-Cut Mailers', mandatory: true },
    { id: 'li-020', lineNumber: 20, description: 'Die-Cut Mailer Box 300x200x100mm', specification: '3-Ply B-Flute, 180 GSM White Top/140F/180K, Self-Locking Ear Lock, 2-Color Print', quantity: 25000, unit: 'EA' as const, category: 'Die-Cut Mailers', mandatory: true },
    { id: 'li-021', lineNumber: 21, description: 'Die-Cut Mailer Box 360x260x120mm', specification: '3-Ply B-Flute, 200 GSM White Top/140F/180K, Self-Locking, 4-Color Process Print', quantity: 18000, unit: 'EA' as const, category: 'Die-Cut Mailers', mandatory: true },
    { id: 'li-022', lineNumber: 22, description: 'Self-Locking Folder Box 420x300x80mm', specification: '3-Ply B-Flute Five Panel Folder (FPF), 180K/120F/180K, Unprinted', quantity: 15000, unit: 'EA' as const, category: 'Die-Cut Mailers', mandatory: false },
    { id: 'li-023', lineNumber: 23, description: 'Corrugated Layer Pad 1150x950mm', specification: '3-Ply Single Wall Layer Separator Sheet, B-Flute, 150K/120F/150K, Flat Die-Cut', quantity: 30000, unit: 'EA' as const, category: 'Fitments & Accessories', mandatory: false },
    { id: 'li-024', lineNumber: 24, description: 'Corrugated Layer Pad 1150x950mm 5-Ply', specification: '5-Ply Heavy Pallet Divider Pad, BC-Flute, 180K/120F/140T/120F/180K, Caliper 6.5mm', quantity: 15000, unit: 'EA' as const, category: 'Fitments & Accessories', mandatory: false },
    { id: 'li-025', lineNumber: 25, description: '12-Cell Corrugated Partition Set', specification: 'Set of Interlocking Slotted Partitions (4x3), 3-Ply B-Flute, 120K/100F/120K, for 400x300x200 box', quantity: 20000, unit: 'SET' as const, category: 'Fitments & Accessories', mandatory: true },
    { id: 'li-026', lineNumber: 26, description: '24-Cell Corrugated Partition Set', specification: 'Set of Interlocking Slotted Partitions (6x4), 3-Ply B-Flute, 140K/120F/140K, for 450x350x300 box', quantity: 15000, unit: 'SET' as const, category: 'Fitments & Accessories', mandatory: true },
    { id: 'li-027', lineNumber: 27, description: 'Heavy Duty Pallet Box with Wooden Skids', specification: '7-Ply AA-Flute Sleeve + Cap + Bottom Tray, 1200x1000x900mm, Static Load 1500 kg', quantity: 1000, unit: 'EA' as const, category: 'Specialty Bulk Packaging', mandatory: true },
    { id: 'li-028', lineNumber: 28, description: 'Octabin Bulk Chemical Container', specification: '7-Ply Octagonal Corrugated Drum, 1100x1100x1200mm, PE Liner Bag Included, Cap 1000 kg', quantity: 800, unit: 'EA' as const, category: 'Specialty Bulk Packaging', mandatory: true },
    { id: 'li-029', lineNumber: 29, description: 'Corrugated Corner Edge Protectors 50x50x1000mm', specification: '5-Ply L-Profile Compressed Corrugated Edge Board, 4mm Thickness, 1000mm Length', quantity: 40000, unit: 'PC' as const, category: 'Fitments & Accessories', mandatory: false },
    { id: 'li-030', lineNumber: 30, description: 'Corrugated Corner Edge Protectors 75x75x1500mm', specification: '7-Ply Heavy L-Profile Edge Board, 6mm Thickness, 1500mm Length', quantity: 25000, unit: 'PC' as const, category: 'Fitments & Accessories', mandatory: false },
  ],
};

export const VENDORS_SEED = [
  { id: 'vendor-001', name: 'Apex Packaging Solutions Pvt Ltd' },
  { id: 'vendor-002', name: 'PackRight Corrugators Ltd' },
  { id: 'vendor-003', name: 'EcoKraft Paper & Packaging LLP' },
  { id: 'vendor-004', name: 'Vardhman Cartons & Containers' },
  { id: 'vendor-005', name: 'Global Star Packaging International LLC' },
];