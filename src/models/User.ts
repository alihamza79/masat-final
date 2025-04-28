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
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 