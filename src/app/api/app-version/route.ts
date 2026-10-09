import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/utils/appVersion';

export const dynamic = 'force-dynamic';

export const GET = () => NextResponse.json({ version: APP_VERSION }, { headers: { 'Cache-Control': 'no-store' } });
