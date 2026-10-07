import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb.js';
import { Setting } from '@/lib/models/index.js';
import { reclassifyBooths } from '@/lib/analytics.js';

export async function GET() {
  try {
    await connectToDatabase();
    let setting = await Setting.findOne({ key: 'booth_thresholds' }).lean();
    if (!setting) {
      setting = {
        key: 'booth_thresholds',
        value: { strong: 50, medium: 30, weak: 0 },
        description: 'Threshold percentages for strong/medium/weak classification',
      };
    }
    return NextResponse.json({ success: true, data: setting.value });
  } catch (error) {
    console.error('API Error in GET /api/settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { strong = 50, medium = 30, weak = 0, year } = body;

    const updated = await Setting.findOneAndUpdate(
      { key: 'booth_thresholds' },
      {
        key: 'booth_thresholds',
        value: { strong: Number(strong), medium: Number(medium), weak: Number(weak) },
        description: 'Threshold percentages for strong/medium/weak classification',
      },
      { upsert: true, new: true }
    );

    // Reclassify booths based on the new rules (optionally filtered by year)
    await reclassifyBooths({ strong: Number(strong), medium: Number(medium) }, year);

    return NextResponse.json({
      success: true,
      message: 'Booth thresholds updated and booths reclassified successfully!',
      data: updated.value,
    });
  } catch (error) {
    console.error('API Error in PUT /api/settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
