import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Product from '../models/Product';
import Chat from '../models/Chat';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-marketplace';

const seedData = async () => {
  try {
    // Connect to database
    console.log('Connecting to MongoDB with URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db?.databaseName);

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Chat.deleteMany({})
    ]);
    console.log('🧹 Cleared existing data');

    // Create sample users (new DTO structure)
    console.log('Creating users...');
    let users;
    try {
      users = await User.create([
        {
          email: 'admin@sjsu.edu',
          userName: 'Admin User',
          password: 'admin123',
          profilePicture: '',
          schoolName: 'San Jose State University',
          sellerRating: 0,
          buyerRating: 0
        },
        {
          email: 'john.seller@sjsu.edu',
          userName: 'John Seller',
          password: 'password123',
          profilePicture: '',
          schoolName: 'San Jose State University',
          sellerRating: 4.7,
          buyerRating: 4.9
        },
        {
          email: 'jane.buyer@sjsu.edu',
          userName: 'Jane Buyer',
          password: 'password123',
          profilePicture: '',
          schoolName: 'San Jose State University',
          sellerRating: 0,
          buyerRating: 4.8
        },
        {
          email: 'mike.student@sjsu.edu',
          userName: 'Mike Student',
          password: 'password123',
          profilePicture: '',
          schoolName: 'San Jose State University',
          sellerRating: 4.5,
          buyerRating: 4.6
        },
        {
          email: 'sarah.chen@sjsu.edu',
          userName: 'Sarah Chen',
          password: 'password123',
          profilePicture: '',
          schoolName: 'San Jose State University',
          sellerRating: 4.9,
          buyerRating: 4.7
        }
      ]);

      console.log('👥 Created sample users:', users.length);
    } catch (error) {
      console.error('Error creating users:', error);
      throw error;
    }

    // Create sample listings
    const listings = await Product.create([
      {
        title: 'Software Engineering Textbook - CMPE 202',
        description: 'Design Patterns: Elements of Reusable Object-Oriented Software by Gang of Four. Excellent condition, minimal highlighting.',
        price: 45.99,
        category: 'textbooks',
        condition: 'good',
        images: ['/uploads/listings/sample1.jpg'],
        seller: users[1]._id, // John Seller
        location: 'SJSU Campus',
        tags: ['software-engineering', 'design-patterns', 'cmpe202']
      },
      {
        title: 'MacBook Pro 13" 2020',
        description: 'MacBook Pro 13-inch with M1 chip. Great for coding and design work. Includes charger and original box.',
        price: 899.99,
        category: 'electronics',
        condition: 'like-new',
        images: ['/uploads/listings/sample2.jpg'],
        seller: users[3]._id, // Mike Student
        location: 'South Campus',
        tags: ['macbook', 'laptop', 'apple', 'm1']
      },
      {
        title: 'IKEA Desk Lamp',
        description: 'Adjustable desk lamp, perfect for late night studying. White color, barely used.',
        price: 15.00,
        category: 'furniture',
        condition: 'like-new',
        images: ['/uploads/listings/sample3.jpg'],
        seller: users[1]._id, // John Seller
        location: 'Campus Village',
        tags: ['desk-lamp', 'ikea', 'study']
      },
      {
        title: 'Calculus Textbook Bundle',
        description: 'Complete calculus series - Calculus I, II, and III textbooks. All in good condition with some notes.',
        price: 120.00,
        category: 'textbooks',
        condition: 'good',
        images: ['/uploads/listings/sample4.jpg'],
        seller: users[4]._id, // Sarah Chen
        location: 'Engineering Building',
        tags: ['calculus', 'math', 'textbook-bundle']
      },
      {
        title: 'Gaming Chair',
        description: 'Ergonomic gaming chair with lumbar support. Black and red color scheme. Very comfortable for long study sessions.',
        price: 150.00,
        category: 'furniture',
        condition: 'good',
        images: ['/uploads/listings/sample5.jpg'],
        seller: users[3]._id, // Mike Student
        location: 'Off-campus Housing',
        tags: ['gaming-chair', 'ergonomic', 'furniture']
      },
      {
        title: 'iPhone 12 Pro',
        description: 'iPhone 12 Pro 128GB in Space Gray. Excellent condition with screen protector and case. Battery health 89%.',
        price: 550.00,
        category: 'electronics',
        condition: 'good',
        images: ['/uploads/listings/sample6.jpg'],
        seller: users[4]._id, // Sarah Chen
        location: 'Student Union',
        tags: ['iphone', 'smartphone', 'apple']
      },
      {
        title: 'Data Structures and Algorithms Book',
        description: 'Introduction to Algorithms by Cormen. The bible of algorithms. Some wear on cover but pages are in great condition.',
        price: 85.00,
        category: 'textbooks',
        condition: 'fair',
        images: ['/uploads/listings/sample7.jpg'],
        seller: users[1]._id, // John Seller
        location: 'Library',
        tags: ['algorithms', 'data-structures', 'computer-science']
      },
      {
        title: 'Mechanical Keyboard',
        description: 'Cherry MX Blue mechanical keyboard. Great for programming. RGB backlight with multiple modes.',
        price: 75.00,
        category: 'electronics',
        condition: 'good',
        images: ['/uploads/listings/sample8.jpg'],
        seller: users[3]._id, // Mike Student
        location: 'Engineering Building',
        tags: ['keyboard', 'mechanical', 'programming', 'rgb']
      }
    ]);

    console.log('📦 Created sample listings');

    // Create a sample chat
    const chats = await Chat.create({
      participants: [users[2]._id, users[1]._id], // Jane Buyer and John Seller
      product: listings[0]._id, // Software Engineering Textbook
      messages: [
        {
          sender: users[2]._id, // Jane Buyer
          content: 'Hi! Is this textbook still available?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: true
        },
        {
          sender: users[1]._id, // John Seller
          content: 'Yes, it is! Are you taking CMPE 202 this semester?',
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
          isRead: true
        },
        {
          sender: users[2]._id, // Jane Buyer
          content: 'Yes, I am! Can we meet at the library tomorrow?',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isRead: false
        }
      ],
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000)
    });

    console.log('💬 Created sample chat');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample users created (userName → userName):');
    users.forEach((u: any) => {
      console.log(`- ${u.userName} → ${u.userName}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedData();

