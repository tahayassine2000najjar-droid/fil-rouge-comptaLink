import mongoose from 'mongoose';

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
  },
  { timestamps: true }
);

export const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
