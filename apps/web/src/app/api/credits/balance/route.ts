import { NextResponse } from 'next/server';
import { getCreditBalance } from '@/lib/credit-middleware';

export async function GET() {
  const balance = await getCreditBalance();

  if (!balance) {
    return NextResponse.json(
      { error: 'Not authenticated or no balance found' },
      { status: 401 }
    );
  }

  return NextResponse.json(balance);
}
