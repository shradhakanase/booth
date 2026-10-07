import mongoose from 'mongoose';

const SourceFileSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      default: 2024,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    fileType: {
      type: String,
      enum: ['xlsx', 'csv', 'pdf', 'unknown'],
      default: 'xlsx',
    },
    filePath: {
      type: String,
      default: '',
    },
    fileHash: {
      type: String,
      default: '',
      index: true,
    },
    totalRows: {
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
    acNo: {
      type: Number,
    },
    acName: {
      type: String,
      default: '',
    },
    candidates: [
      {
        type: String,
      },
    ],
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED', 'SKIPPED', 'REVIEW'],
      default: 'PENDING',
      index: true,
    },
    processingErrors: [
      {
        type: String,
      },
    ],
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate file per district per year
SourceFileSchema.index({ year: 1, district: 1, originalFileName: 1 }, { unique: true });

export default mongoose.models.SourceFile || mongoose.model('SourceFile', SourceFileSchema);
