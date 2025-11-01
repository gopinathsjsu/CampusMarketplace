import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  userName: string;
  password: string;
  profilePicture: string;
  schoolName: string;
  sellerRating: number;
  buyerRating: number;
  // Compatibility fields used across routes (optional)
  firstName?: string;
  lastName?: string;
  university?: string;
  phone?: string;
  role?: 'buyer' | 'seller' | 'admin';
  isVerified?: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  userName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Optional fields for broader compatibility with existing routes
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  university: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: ''
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  sellerRating: {
    type: Number,
    default: 0
  },
  buyerRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: false },
  toObject: { virtuals: false }
});

// Indices
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUser>('User', userSchema);

