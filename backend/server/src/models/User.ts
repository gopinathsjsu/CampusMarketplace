import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  userName: string;
  password: string;
  profilePicture: string;
  schoolName: string;
  sellerRating: number;
  buyerRating: number;
  // Virtuals
  firstName?: string;
  lastName?: string;
  university?: string;
  avatar?: string;
  // Optional fields
  phone?: string;
  role?: "user" | "admin";
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    userName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    sellerRating: {
      type: Number,
      default: 0,
    },
    buyerRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indices
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtuals for backward compatibility
userSchema.virtual("firstName").get(function () {
  if (!this.userName) return "";
  const parts = this.userName.split(" ");
  return parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0];
});

userSchema.virtual("lastName").get(function () {
  if (!this.userName) return "";
  const parts = this.userName.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
});

userSchema.virtual("avatar").get(function () {
  return this.profilePicture || "";
});

userSchema.virtual("university").get(function () {
  return this.schoolName || "";
});

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUser>("User", userSchema);
