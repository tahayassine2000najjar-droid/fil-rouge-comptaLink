import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['entreprise', 'cabinet', 'admin'], required: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    refreshTokenHashes: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const {
      password,
      verificationToken,
      verificationTokenExpires,
      resetPasswordToken,
      resetPasswordExpires,
      refreshTokenHashes,
      __v,
      ...rest
    } = ret;
    void password;
    void verificationToken;
    void verificationTokenExpires;
    void resetPasswordToken;
    void resetPasswordExpires;
    void refreshTokenHashes;
    void __v;
    return rest;
  },
});

export const User = mongoose.model('User', userSchema);
