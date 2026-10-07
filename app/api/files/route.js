import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import { SourceFile } from '@/lib/models/index.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const yearParam = searchParams.get('year');
    const district = searchParams.get('district') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const query = {};
    if (yearParam) {
      query.year = Number(yearParam);
    }
    if (district) {
      query.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }
    if (status) {
      query.processingStatus = status;
    }
    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { acName: { $regex: search, $options: 'i' } },
      ];
    }

    const files = await SourceFile.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: files.length,
      data: files,
    });
  } catch (error) {
    console.error('API Error in /api/files:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
