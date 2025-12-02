
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define minimal User schema for checking
const userSchema = new mongoose.Schema({
  email: String,
  userName: String,
  password: { type: String, select: true } // Force select true to see hash
});
const User = mongoose.model('User', userSchema);

const run = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/campus-marketplace';
    console.log(`Connecting to ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log({
        id: u._id,
        email: u.email,
        userName: u.userName,
        passwordHash: u.password ? u.password.substring(0, 10) + '...' : 'MISSING'
      });
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
