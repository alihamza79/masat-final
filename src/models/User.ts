import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  image?: string;
  phone?: string;
  googleLinked?: boolean;
  facebookLinked?: boolean;
  credentialsLinked?: boolean;
  emailVerified?: boolean;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete' | null;
  subscriptionPlan?: string | null;
  subscriptionId?: string | null;
  subscriptionCreatedAt?: Date | null;
  subscriptionExpiresAt?: Date | null;
  subscriptionBillingCycle?: 'monthly' | 'yearly' | null;
  stripePriceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    googleLinked: {
      type: Boolean,
      default: false,
    },
    facebookLinked: {
      type: Boolean,
      default: false,
    },
    credentialsLinked: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'unpaid', 'incomplete', null],
      default: null,
    },
    subscriptionPlan: {
      type: String,
      default: 'free',
    },
    subscriptionId: {
      type: String,
      index: true,
    },
    subscriptionCreatedAt: {
      type: Date,
    },
    subscriptionExpiresAt: {
      type: Date,
    },
    subscriptionBillingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
    },
    stripePriceId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 