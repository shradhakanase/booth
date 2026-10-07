import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import { SourceFile, Booth } from '@/lib/models/index.js';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const id = params.id;

    const file = await SourceFile.findById(id).lean();
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const boothsCount = await Booth.countDocuments({ sourceFile: file.originalFileName });

    return NextResponse.json({
      success: true,
      data: {
        ...file,
        boothsCount,
      },
    });
  } catch (error) {
    console.error('API Error in /api/files/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const id = params.id;

    const file = await SourceFile.findById(id);
    if (!file) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // Delete associated booth records to maintain data consistency
    await Booth.deleteMany({ sourceFile: file.originalFileName });
    await SourceFile.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `File ${file.originalFileName} and associated booths deleted successfully.`,
    });
  } catch (error) {
    console.error('API Error in DELETE /api/files/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
