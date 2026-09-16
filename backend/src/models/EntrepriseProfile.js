import mongoose from 'mongoose';

const entrepriseProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    legalForm: { type: String, default: '' },
    siret: { type: String, default: '' },
    industry: { type: String, default: '' },
    size: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'France' },
    phone: { type: String, default: '' },
    logo: { type: String, default: '' },
    foundedYear: { type: Number, default: new Date().getFullYear() },
  },
  { timestamps: true }
);

export const EntrepriseProfile = mongoose.model('EntrepriseProfile', entrepriseProfileSchema);
