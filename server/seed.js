require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB');

    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('[Seed] Admin user already exists, skipping.');
    } else {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@nms.local',
        passwordHash,
        role: 'admin'
      });
      console.log('[Seed] Admin user created (username: admin, password: admin123)');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  }
}

seed();
