import mongoose from 'mongoose';

export const CABINET_SERVICES = [
  'Comptabilit\u00e9 g\u00e9n\u00e9rale',
  'Gestion de la paie',
  'Fiscalit\u00e9',
  'Audit',
  'Conseil financier',
  'Juridique',
  'Tenue de comptabilit\u00e9',
  'Commissariat aux comptes',
  'Gestion de tr\u00e9sorerie',
  'Cr\u00e9ation d\'entreprise',
];

const cabinetProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    firmName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    legalForm: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    country: { type: String, default: 'France' },
    phone: { type: String, default: '' },
    emailContact: { type: String, default: '' },
    website: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    teamSize: { type: Number, default: 1 },
    services: { type: [String], enum: CABINET_SERVICES, default: [] },
    specialities: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    documents: {
      type: [
        {
          name: { type: String },
          filePath: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, default: '' },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

cabinetProfileSchema.index({ ratingAvg: -1 });
cabinetProfileSchema.index({ firmName: 'text', description: 'text', tagline: 'text' });

export const CabinetProfile = mongoose.model('CabinetProfile', cabinetProfileSchema);
