
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Chat from '../models/Chat';
import Product from '../models/Product';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
  console.log('🧪 Starting Verification Script (Final Check)...');
  
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/campus-marketplace';
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({ email: /test-verify-.*@example.com/ });
    
    console.log('\n--- Testing User Virtuals ---');
    const user = await User.create({
      userName: 'Eugene Kim',
      email: `test-verify-${Date.now()}@example.com`,
      password: 'password123',
      schoolName: 'San Jose State University',
      profilePicture: 'http://example.com/pic.jpg'
    });

    if (user.firstName !== 'Eugene' || user.lastName !== 'Kim') {
      throw new Error(`❌ User virtuals failed! Got: ${user.firstName} ${user.lastName}`);
    } else {
      console.log('✅ User virtuals working correctly.');
    }

    console.log('\n--- Testing Product Populate ---');
    const product = await Product.create({
      title: 'Test Textbook',
      description: 'A test book',
      price: 50,
      category: 'textbooks',
      condition: 'new',
      images: ['test.jpg'],
      seller: user._id,
      location: 'Library',
      status: 'available'
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'userName profilePicture firstName lastName avatar university schoolName');
    
    const seller = populatedProduct?.seller as any;
    if (seller.firstName === 'Eugene') {
      console.log('✅ Product populate works (virtuals visible).');
    } else {
      throw new Error(`❌ Product populate failed. Got: ${seller.firstName}`);
    }

    console.log('\n--- Testing Chat Populate ---');
    const buyer = await User.create({
        userName: 'Seth Rog',
        email: `test-verify-buyer-${Date.now()}@example.com`,
        password: 'password123',
        schoolName: 'SJSU'
    });

    const chat = await Chat.findOrCreateChat(buyer._id as any, user._id as any, product._id as any);
    const p1 = chat.participants.find((p: any) => p._id.toString() === user._id.toString()) as any;

    if (p1.firstName === 'Eugene') {
        console.log('✅ Chat populate works.');
    } else {
        throw new Error(`❌ Chat populate failed. Got: ${p1.firstName}`);
    }

    console.log('\n--- Testing AI Logic (Mock) ---');
    const filters: any = { status: 'available', category: 'textbooks', price: { $lte: 50 } };
    const aiResults = await Product.find(filters);
    
    if (aiResults.some(p => p._id.toString() === product._id.toString())) {
        console.log('✅ AI Search found the test product.');
    } else {
        console.log('⚠️ AI Search did not find product (maybe price/category mismatch?)');
    }

    console.log('\nCleaning up...');
    await User.deleteMany({ _id: { $in: [user._id, buyer._id] } });
    await Product.deleteMany({ _id: product._id });
    await Chat.deleteMany({ _id: chat._id });
    
    console.log('Done.');

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
