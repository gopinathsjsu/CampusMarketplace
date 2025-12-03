import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  sellerId: mongoose.Types.ObjectId;
  buyerId?: mongoose.Types.ObjectId | null;
  status: 'available' | 'sold' | 'pending';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  tags: string[];
  views: number;
  isReported: boolean;
  reportedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  incrementViews(): Promise<IProduct>;
  markAsSold(): Promise<IProduct>;
  reportProduct(userId: mongoose.Types.ObjectId): Promise<IProduct>;
}

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'textbooks',
      'electronics',
      'furniture',
      'clothing',
      'sports',
      'supplies',
      'other'
    ]
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
    enum: ['new', 'like-new', 'good', 'fair', 'poor']
  },
  images: [{
    type: String,
    required: true
  }],
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'pending'],
    default: 'available'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ sellerId: 1 });
productSchema.index({ buyerId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ latitude: 1, longitude: 1 });

// Virtual for seller information
productSchema.virtual('sellerInfo', {
  ref: 'User',
  localField: 'sellerId',
  foreignField: '_id',
  justOne: true
});

// Method to increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to mark as sold
productSchema.methods.markAsSold = function() {
  this.status = 'sold';
  return this.save();
};

// Method to report product
productSchema.methods.reportProduct = function(userId: mongoose.Types.ObjectId) {
  if (!this.reportedBy.includes(userId)) {
    this.reportedBy.push(userId);
    this.isReported = true;
  }
  return this.save();
};

export default mongoose.model<IProduct>('Product', productSchema);
