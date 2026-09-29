import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['entreprise', 'cabinet'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const sideSchema = new mongoose.Schema(
  {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
  },
  { _id: false }
);

const termsSchema = new mongoose.Schema(
  {
    entreprise: { type: sideSchema, default: () => ({}) },
    cabinet: { type: sideSchema, default: () => ({}) },
    bothAcceptedAt: { type: Date, default: null },
  },
  { _id: false }
);

const quoteRequestSchema = new mongoose.Schema(
  {
    entreprise: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cabinet: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: String, required: true },
    budget: { type: String, default: '' },
    timeline: { type: String, default: '' },
    description: { type: String, required: true },
    documents: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled'],
      default: 'pending',
    },
    response: {
      price: { type: Number, default: 0 },
      duration: { type: String, default: '' },
      message: { type: String, default: '' },
      respondedAt: { type: Date, default: null },
    },
    messages: { type: [messageSchema], default: [] },
    terms: { type: termsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
