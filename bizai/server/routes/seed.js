const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Sale     = require('../models/Sale');
const Customer = require('../models/Customer');
const Product  = require('../models/Product');

router.use(auth);

// ── POST /api/seed/demo ───────────────────────────────────────────────────────
// Wipes user data and inserts 30 days of realistic demo data
router.post('/demo', async (req, res) => {
  try {
    const uid = req.user.id;

    // Clear existing data for this user
    await Promise.all([
      Sale.deleteMany({ userId: uid }),
      Customer.deleteMany({ userId: uid }),
      Product.deleteMany({ userId: uid }),
    ]);

    const now   = new Date();
    const sales = [];
    const customers = [];

    const categories = ['Food & Beverages','Clothing','Electronics','Services','Groceries','Health & Beauty','Other'];
    const descriptions = {
      'Food & Beverages': ['Lunch order','Coffee + snacks','Bulk grocery order','Party platter','Breakfast set'],
      'Clothing':         ['Kurta set','T-shirts x3','Kids uniform','Saree sale','Jacket order'],
      'Electronics':      ['Phone repair','Earphones','Charger cable','Screen guard','Bluetooth speaker'],
      'Services':         ['Tailoring job','Home delivery','Alterations','Packaging service','Consultation'],
      'Groceries':        ['Rice & dal','Vegetable pack','Monthly ration','Spice bundle','Flour sack'],
      'Health & Beauty':  ['Facewash pack','Hair oil set','Sanitizer bulk','Vitamin tablets','Lip balm'],
      'Other':            ['Custom order','Wholesale supply','Misc items','Special request','Gift wrapping'],
    };

    const customerNames = [
      'Rahul Sharma','Priya Patel','Aman Verma','Sunita Devi','Rohit Kumar',
      'Meena Gupta','Vijay Singh','Anita Joshi','Deepak Nair','Kavya Rao',
      'Sanjay Mehta','Pooja Tiwari','Arjun Reddy','Neha Saxena','Ravi Agarwal',
    ];

    // Seed 20 realistic products across categories
    const demoProducts = [
      { name:'Basmati Rice (5kg)',    price:320,  stock:50,  category:'Groceries',        unit:'pack' },
      { name:'Toor Dal (1kg)',        price:140,  stock:80,  category:'Groceries',        unit:'kg' },
      { name:'Amul Butter (500g)',    price:280,  stock:30,  category:'Food & Beverages', unit:'piece' },
      { name:'Whole Wheat Atta (10kg)', price:380, stock:40, category:'Groceries',        unit:'pack' },
      { name:'Maggi Noodles (12pk)', price:130,  stock:60,  category:'Food & Beverages', unit:'pack' },
      { name:'Parle-G Biscuits',      price:20,   stock:200, category:'Food & Beverages', unit:'piece' },
      { name:'Surf Excel (1kg)',      price:220,  stock:45,  category:'Other',            unit:'piece' },
      { name:'Dettol Soap (3pk)',     price:120,  stock:70,  category:'Health & Beauty',  unit:'pack' },
      { name:'Colgate Toothpaste',    price:95,   stock:55,  category:'Health & Beauty',  unit:'piece' },
      { name:'Parachute Coconut Oil', price:150,  stock:40,  category:'Health & Beauty',  unit:'bottle' },
      { name:'Lay\'s Chips (Large)',  price:40,   stock:100, category:'Food & Beverages', unit:'piece' },
      { name:'Britannia Bread',       price:45,   stock:30,  category:'Food & Beverages', unit:'piece' },
      { name:'Rin Detergent (500g)',  price:65,   stock:60,  category:'Other',            unit:'piece' },
      { name:'Hajmola Candy',         price:10,   stock:200, category:'Food & Beverages', unit:'pack' },
      { name:'Men\'s Cotton Vest',    price:180,  stock:25,  category:'Clothing',         unit:'piece' },
      { name:'School Copy (Pack 6)',   price:60,   stock:80,  category:'Other',            unit:'pack' },
      { name:'Ballpoint Pen (10pk)',  price:50,   stock:150, category:'Other',            unit:'pack' },
      { name:'AA Batteries (4pk)',    price:85,   stock:40,  category:'Electronics',      unit:'pack' },
      { name:'Phone Charging Cable',  price:120,  stock:20,  category:'Electronics',      unit:'piece' },
      { name:'Nimbooz (600ml)',        price:30,   stock:90,  category:'Food & Beverages', unit:'bottle' },
    ].map(p => ({ ...p, userId: uid, inStock: true, description: '' }));

    // Generate 30 days of daily sales (2–7 per day, weekends higher)
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const txCount = isWeekend
        ? 4 + Math.floor(Math.random() * 4)
        : 2 + Math.floor(Math.random() * 4);

      for (let t = 0; t < txCount; t++) {
        const cat   = categories[Math.floor(Math.random() * categories.length)];
        const descs = descriptions[cat];
        const desc  = descs[Math.floor(Math.random() * descs.length)];
        const base  = cat === 'Electronics' ? 400 : cat === 'Clothing' ? 300 : 100;
        const amount = base + Math.floor(Math.random() * base * 2);
        const txDate = new Date(date);
        txDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
        sales.push({ userId: uid, amount, description: desc, category: cat, date: txDate });
      }
    }

    // Generate 15 customers
    for (let i = 0; i < 15; i++) {
      const isNew = i < 7;
      const date  = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 28));
      customers.push({
        userId: uid,
        name:   customerNames[i],
        email:  `${customerNames[i].toLowerCase().replace(' ', '.')}@demo.com`,
        isNewCustomer: isNew,
        visitCount: isNew ? 1 : 2 + Math.floor(Math.random() * 8),
        date,
      });
    }

    await Promise.all([
      Sale.insertMany(sales),
      Customer.insertMany(customers),
      Product.insertMany(demoProducts),
    ]);

    res.json({
      success: true,
      message: `Seeded ${sales.length} sales, ${customers.length} customers, and ${demoProducts.length} products!`,
      data: { salesCount: sales.length, customersCount: customers.length, productCount: demoProducts.length },
    });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ success: false, message: 'Could not seed demo data.' });
  }

});

module.exports = router;
