import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    entreprise: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cabinet: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationMin: { type: Number, default: 30 },
    mode: { type: String, enum: ['visio', 'phone', 'onsite'], default: 'visio' },
    purpose: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ cabinet: 1, date: 1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
