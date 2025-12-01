
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Chat from '../models/Chat';
import Product from '../models/Product';

dotenv.config();

const run = async () => {
  try {
    // 1. Connect to DB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campus-marketplace';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 2. Create Dummy Users
    const seller = await User.create({
      userName: 'Test Seller',
      email: `seller-${Date.now()}@test.com`,
      password: 'password123',
      schoolName: 'SJSU',
      profilePicture: 'seller-pic.jpg'
    });

    const buyer = await User.create({
      userName: 'Test Buyer',
      email: `buyer-${Date.now()}@test.com`,
      password: 'password123',
      schoolName: 'SJSU',
      profilePicture: 'buyer-pic.jpg'
    });

    console.log('Created users:', seller._id, buyer._id);

    // 3. Create Dummy Product
    const product = await Product.create({
      title: 'Test Book',
      description: 'A test book',
      price: 10,
      category: 'textbooks',
      condition: 'new',
      images: ['test.jpg'],
      seller: seller._id,
      location: 'Library'
    });

    // 4. Test Chat Creation & Population
    console.log('Creating chat...');
    const chat = await Chat.findOrCreateChat(buyer._id as mongoose.Types.ObjectId, seller._id as mongoose.Types.ObjectId, product._id as mongoose.Types.ObjectId);
    
    console.log('Chat participants loaded:', chat.participants.length);
    
    const p1 = chat.participants[0] as any;
    console.log('Participant 1 (Buyer):', {
      id: p1._id,
      userName: p1.userName,
      firstName: p1.firstName, // Virtual
      lastName: p1.lastName,   // Virtual
      avatar: p1.avatar        // Virtual
    });

    if (!p1.firstName || !p1.avatar) {
        console.error('❌ FAILURE: Virtuals did not populate!');
    } else {
        console.log('✅ SUCCESS: Virtuals populated correctly.');
    }

    // Cleanup
    await Chat.deleteMany({ _id: chat._id });
    await Product.deleteMany({ _id: product._id });
    await User.deleteMany({ _id: { $in: [seller._id, buyer._id] } });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
