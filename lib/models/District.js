import mongoose from 'mongoose';

const DistrictSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      default: 2024,
      index: true,
    },
    districtName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    districtCode: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: 'Uttar Pradesh',
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    totalConstituencies: {
      type: Number,
      default: 0,
    },
    totalBooths: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    totalValidVotes: {
      type: Number,
      default: 0,
    },
    totalElectors: {
      type: Number,
      default: 0,
    },
    winningParty: {
      type: String,
      default: '',
    },
    winningCandidate: {
      type: String,
      default: '',
    },
    winningMargin: {
      type: Number,
      default: 0,
    },
    avgVotesPerBooth: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DistrictSchema.index({ year: 1, districtName: 1 }, { unique: true });

export default mongoose.models.District || mongoose.model('District', DistrictSchema);
