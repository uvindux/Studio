import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
          name: { type: String, required: true },
          role: { type: String, required: true },
          constraints: { type: String, default: 'No specific constraints.' },
          avatar: { type: String, default: '' }
}, { timestamps: true });

const Staff = mongoose.model('Staff', StaffSchema);

export default Staff;
