import mongoose from 'mongoose';

const CandidateVoteSchema = new mongoose.Schema(
  {
    candidate: {
      type: String,
      required: true,
    },
    party: {
      type: String,
      default: 'IND',
    },
    votes: {
      type: Number,
      required: true,
      default: 0,
    },
    voteShare: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const BoothSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      default: 2024,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    assemblyConstituency: {
      type: String,
      required: true,
      index: true,
    },
    acNo: {
      type: Number,
      index: true,
    },
    boothNumber: {
      type: Number,
      required: true,
      index: true,
    },
    pollingStation: {
      type: String,
      default: '',
    },
    electors: {
      type: Number,
      default: 0,
    },
    candidateVotes: [CandidateVoteSchema],
    validVotes: {
      type: Number,
      default: 0,
    },
    rejectedVotes: {
      type: Number,
      default: 0,
    },
    nota: {
      type: Number,
      default: 0,
    },
    tenderedVotes: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    winner: {
      candidate: { type: String, default: '' },
      party: { type: String, default: '' },
      votes: { type: Number, default: 0 },
      voteShare: { type: Number, default: 0 },
    },
    runnerUp: {
      candidate: { type: String, default: '' },
      party: { type: String, default: '' },
      votes: { type: Number, default: 0 },
      voteShare: { type: Number, default: 0 },
    },
    winningMargin: {
      type: Number,
      default: 0,
      index: true,
    },
    winningMarginPercent: {
      type: Number,
      default: 0,
    },
    performanceCategory: {
      type: String,
      enum: ['strong', 'medium', 'weak', 'neutral'],
      default: 'neutral',
      index: true,
    },
    sourceFile: {
      type: String,
      required: true,
      index: true,
    },
    sourceRow: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for uniqueness & fast dashboard lookups scoped by year
BoothSchema.index({ year: 1, district: 1, assemblyConstituency: 1, boothNumber: 1 }, { unique: true });
BoothSchema.index({ year: 1, district: 1, boothNumber: 1 });
BoothSchema.index({ year: 1, district: 1, performanceCategory: 1 });
BoothSchema.index({ year: 1, assemblyConstituency: 1, performanceCategory: 1 });
BoothSchema.index({ year: 1, winningMargin: -1 });

export default mongoose.models.Booth || mongoose.model('Booth', BoothSchema);
