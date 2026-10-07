import mongoose from 'mongoose';

const ConstituencySchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      default: 2024,
      index: true,
    },
    acNo: {
      type: Number,
      default: 0,
      index: true,
    },
    acName: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    pcNo: {
      type: Number,
    },
    pcName: {
      type: String,
      default: '',
    },
    totalBooths: {
      type: Number,
      default: 0,
    },
    totalElectors: {
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
    nota: {
      type: Number,
      default: 0,
    },
    turnoutPercent: {
      type: Number,
      default: 0,
    },
    candidateTotals: [
      {
        candidate: String,
        party: String,
        votes: Number,
        voteShare: Number,
        boothsWon: Number,
      },
    ],
    winner: {
      candidate: String,
      party: String,
      votes: Number,
      voteShare: Number,
    },
    runnerUp: {
      candidate: String,
      party: String,
      votes: Number,
      voteShare: Number,
    },
    winningMargin: {
      type: Number,
      default: 0,
    },
    winningMarginPercent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index scoped by year
ConstituencySchema.index({ year: 1, district: 1, acName: 1 }, { unique: true });

export default mongoose.models.Constituency || mongoose.model('Constituency', ConstituencySchema);
