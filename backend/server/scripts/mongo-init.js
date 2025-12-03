// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('campus-marketplace');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'university'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['buyer', 'seller', 'admin']
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'price', 'category', 'condition', 'sellerId'],
      properties: {
        category: {
          enum: ['textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'supplies', 'other']
        },
        condition: {
          enum: ['new', 'like-new', 'good', 'fair', 'poor']
        },
        status: {
          enum: ['available', 'sold', 'pending']
        },
        price: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('chats');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ university: 1 });
db.users.createIndex({ role: 1 });

db.products.createIndex({ sellerId: 1 });
db.products.createIndex({ buyerId: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ title: 'text', description: 'text', tags: 'text' });

db.chats.createIndex({ participants: 1 });
db.chats.createIndex({ product: 1 });
db.chats.createIndex({ lastActivity: -1 });
db.chats.createIndex({ participants: 1, product: 1 }, { unique: true });

print('✅ Campus Marketplace database initialized successfully!');


