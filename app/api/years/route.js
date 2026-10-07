import { NextResponse } from 'next/server';
import { electionFetch } from '@/lib/electionapi';

export const dynamic = 'force-dynamic';

const labels = {
  VS2017: ['2017 Assembly Elections', 'Vidhan Sabha (Assembly)'],
  LS2019: ['2019 General Elections', 'Lok Sabha (General)'],
  VS2022: ['2022 Assembly Elections', 'Vidhan Sabha (Assembly)'],
  LS2024: ['2024 General Elections', 'Lok Sabha (General)'],
};

export async function GET() {
  try {
    const meta = await electionFetch('/api/meta');
    const years = (meta.elections || []).map((election) => {
      const year = Number(String(election).slice(2));
      const [label, type] = labels[election] || [`${year} Election Data`, 'Election Data'];
      return { year, label, type, hasData: true };
    }).sort((a, b) => b.year - a.year);

    return NextResponse.json({
      success: true,
      defaultYear: years[0]?.year || 2024,
      years,
      activeYears: years.map((item) => item.year),
      meta,
    });
  } catch (error) {
    console.error('API Error in /api/years:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
