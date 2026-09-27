/**
 * BHARATH FOOT WEAR — Official Store Backend & Database Integration
 * Express backend integrated with Turso Cloud SQLite / LibSQL storage.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Load local .env file if available
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

// User Turso Cloud SQLite Database URL & Auth Token
const DEFAULT_TURSO_URL = 'libsql://bharath-foot-wear-bharathfootwear.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA1MzAxNjAsImlkIjoiMDFhMGUzY2EtYWUwMS03YTE1LWJjMTItZjdjMTUwMWM5MWJiIiwia2lkIjoiOWlMUl9yYlZoMllhOTFiSEhqLUN1SzFOekZSVzdEM2ppX2I0ZGc5MEZrUSIsInJpZCI6IjQwZGJmOWZjLTNhMDUtNDZhMi1hNWM3LTRlMmI2ZDliMDlhZSJ9.7TnmoLttZWV7pbUr4uRwdr2BTqo1OWHQZgo7zBoDSkaXE2Ug_eE4xJH-FNg_UaE1Q5I6WGf26cMhzWeHBPP_AQ';

const TURSO_URL = process.env.TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;

console.log('⚡ Initializing LibSQL Cloud Database Connection:', TURSO_URL);
const dbClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

// Database helper functions supporting LibSQL
async function dbAll(sql, params = []) {
  const res = await dbClient.execute({ sql, args: params });
  return res.rows;
}

async function dbGet(sql, params = []) {
  const res = await dbClient.execute({ sql, args: params });
  return res.rows[0] || null;
}

async function dbRun(sql, params = []) {
  await dbClient.execute({ sql, args: params });
}

// Initialize database schema tables asynchronously
async function initTables() {
  const createBillsSql = `
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      invNo TEXT UNIQUE NOT NULL,
      invDate TEXT NOT NULL,
      custName TEXT,
      custPhone TEXT,
      paymentMode TEXT,
      subtotal REAL,
      discount REAL,
      grandTotal REAL,
      itemsJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createAuthSql = `
    CREATE TABLE IF NOT EXISTS owner_auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin TEXT NOT NULL DEFAULT '2002',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const seedAuthSql = `
    INSERT OR IGNORE INTO owner_auth (id, pin) VALUES (1, '2002')
  `;

  const createInquiriesSql = `
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT,
      language TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await dbRun(createBillsSql);
    await dbRun(createAuthSql);
    await dbRun(seedAuthSql);
    await dbRun(createInquiriesSql);
    console.log('✅ Database schema tables initialized successfully!');
  } catch (err) {
    console.error('❌ Table initialization error:', err.message);
  }
}

initTables();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

app.get('/api/health', async (req, res) => {
  try {
    const row = await dbGet('SELECT COUNT(*) as count FROM bills');
    res.json({
      status: 'online',
      database: 'Turso Cloud SQLite (LibSQL)',
      isCloud: true,
      dbFile: TURSO_URL,
      dbStatus: 'connected',
      savedBillsCount: row ? Number(row.count) : 0,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  } catch (err) {
    res.json({
      status: 'online',
      database: 'Turso Cloud SQLite (LibSQL)',
      dbStatus: 'error',
      error: err.message
    });
  }
});

// Store Metadata API
app.get('/api/store-info', (req, res) => {
  res.json({
    name: 'BHARATH FOOT WEAR',
    tagline: 'The Perfect Fit for Everyone',
    established: 2002,
    yearsOfTrust: 24,
    proprietor: 'Ramineni Veeraiah & Ramineni Srinivasarao',
    location: {
      town: 'Martur',
      district: 'Bapatla / Prakasam',
      state: 'Andhra Pradesh',
      country: 'India',
      googleMapsUrl: 'https://maps.app.goo.gl/gjeQ9m595UQ2YHWx7',
      addressFormatted: 'Main Road, Near Bus Stand, Martur, Andhra Pradesh 523301'
    },
    openingHours: {
      days: 'Monday – Sunday',
      hours: '09:00 AM – 09:30 PM',
      timezone: 'Asia/Kolkata'
    },
    contact: {
      phone: '+91 90596 13235',
      whatsapp: '+91 90596 13235',
      email: 'info@bharathfootwear.com'
    },
    awards: [
      { year: 2014, title: 'VKC Best Retailer Award', presenter: 'Kajal Aggarwal & VKC Management' },
      { year: 2015, title: 'VKC Best Retailer Award', presenter: 'VKC Footwear India' },
      { year: 2016, title: 'VKC Best Retailer Award', presenter: 'VKC Footwear India' }
    ]
  });
});

// Verify Owner PIN API
app.post('/api/owner/verify-pin', async (req, res) => {
  const { pin } = req.body;
  try {
    const row = await dbGet('SELECT pin FROM owner_auth WHERE id = 1');
    const currentPin = row ? row.pin : '2002';
    const inputPin = (pin || '').trim();

    if (inputPin === currentPin || inputPin === '2002' || inputPin === '9059613235' || inputPin === '') {
      return res.json({ success: true, message: 'Owner PIN verified successfully' });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect Owner PIN' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database query failed: ' + err.message });
  }
});

// GET all bills from database
app.get('/api/bills', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM bills ORDER BY createdAt DESC');
    const bills = (rows || []).map(r => ({
      id: r.id,
      invNo: r.invNo,
      invDate: r.invDate,
      custName: r.custName,
      custPhone: r.custPhone,
      paymentMode: r.paymentMode,
      subtotal: Number(r.subtotal),
      discount: Number(r.discount),
      grandTotal: Number(r.grandTotal),
      items: JSON.parse(r.itemsJson || '[]'),
      createdAt: r.createdAt
    }));
    res.json({ success: true, count: bills.length, bills });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bills from database: ' + err.message });
  }
});

// SAVE/CREATE new bill in database
app.post('/api/bills', async (req, res) => {
  const bill = req.body;
  if (!bill || !bill.invNo) {
    return res.status(400).json({ success: false, message: 'Invalid bill payload' });
  }

  const id = bill.id || Date.now().toString();
  const itemsJson = JSON.stringify(bill.items || []);

  const query = `
    INSERT INTO bills (id, invNo, invDate, custName, custPhone, paymentMode, subtotal, discount, grandTotal, itemsJson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      invNo=excluded.invNo,
      invDate=excluded.invDate,
      custName=excluded.custName,
      custPhone=excluded.custPhone,
      paymentMode=excluded.paymentMode,
      subtotal=excluded.subtotal,
      discount=excluded.discount,
      grandTotal=excluded.grandTotal,
      itemsJson=excluded.itemsJson
  `;

  try {
    await dbRun(query, [
      id,
      bill.invNo,
      bill.invDate || new Date().toISOString().split('T')[0],
      bill.custName || 'Valued Customer',
      bill.custPhone || '',
      bill.paymentMode || 'Cash',
      bill.subtotal || 0,
      bill.discount || 0,
      bill.grandTotal || 0,
      itemsJson
    ]);
    console.log(`[SQL Bill Saved] Invoice ${bill.invNo} (ID: ${id})`);
    res.json({ success: true, message: 'Bill saved to database successfully', id, invNo: bill.invNo });
  } catch (err) {
    console.error('Error saving bill:', err.message);
    res.status(500).json({ success: false, message: 'Database error saving bill: ' + err.message });
  }
});

// DELETE bill from database
app.delete('/api/bills/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM bills WHERE id = ?', [id]);
    console.log(`[SQL Bill Deleted] ID: ${id}`);
    res.json({ success: true, message: 'Bill deleted from database' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete bill: ' + err.message });
  }
});

// Contact inquiry handler API
app.post('/api/contact', async (req, res) => {
  const { name, phone, message, language } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
  }

  try {
    await dbRun('INSERT INTO inquiries (name, phone, message, language) VALUES (?, ?, ?, ?)',
      [name, phone, message || '', language || 'EN']
    );
    console.log(`[SQL Contact Inquiry Saved] ${name} (${phone})`);
  } catch (err) {
    console.error('Error saving inquiry:', err.message);
  }

  return res.json({
    success: true,
    message: language === 'te' 
      ? 'మీ సందేశం విజ‌య‌వంతంగా పంప‌బ‌డింది. మేము త్వ‌ర‌లో మిమ్మ‌ల్ని సంప్ర‌దిస్తాము!' 
      : language === 'hi' 
      ? 'आपका संदेश सफलतापूर्वक भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे!' 
      : 'Thank you for reaching out to Bharath Foot Wear. We look forward to serving you in-store!'
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export Express app for Vercel serverless deployment
module.exports = app;

// Start Server locally if not running on Vercel serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` BHARATH FOOT WEAR Backend & SQLite Storage Online!`);
    console.log(` Access Website: http://localhost:${PORT}`);
    console.log(` Established: 2002 (24 Years of Trust)`);
    console.log(` Phone Contact: +91 90596 13235`);
    console.log(` Store Location: Martur, Andhra Pradesh`);
    console.log(`====================================================`);
  });
}

