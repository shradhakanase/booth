import { NextResponse } from 'next/server';
import { electionFetch } from '@/lib/electionapi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await electionFetch('/api/meta'));
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
