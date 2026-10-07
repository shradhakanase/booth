import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      default: 2024,
      index: true,
    },
    candidateName: {
      type: String,
      required: true,
      index: true,
    },
    party: {
      type: String,
      default: 'IND',
      index: true,
    },
    district: {
      type: String,
      index: true,
    },
    assemblyConstituency: {
      type: String,
      index: true,
    },
    acNo: {
      type: Number,
      index: true,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    voteShare: {
      type: Number,
      default: 0,
    },
    boothsWon: {
      type: Number,
      default: 0,
    },
    boothsLost: {
      type: Number,
      default: 0,
    },
    totalBoothsContested: {
      type: Number,
      default: 0,
    },
    avgVotesPerBooth: {
      type: Number,
      default: 0,
    },
    highestVoteBooth: {
      boothNumber: Number,
      pollingStation: String,
      votes: Number,
      district: String,
      acName: String,
    },
    lowestVoteBooth: {
      boothNumber: Number,
      pollingStation: String,
      votes: Number,
      district: String,
      acName: String,
    },
    winningMargin: {
      type: Number,
      default: 0,
    },
    isWinner: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

CandidateSchema.index({ year: 1, district: 1, candidateName: 1, assemblyConstituency: 1 }, { unique: true });

export default mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema);
