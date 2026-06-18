import { getSheetData } from '../../../lib/googleSheets';
import { NextResponse } from 'next/server';

const PRIVILEGES_SHEET_ID = '16i_7nny1QbFkFvhqnTX9ebgCOT7WeUmq8Uz_r5Vaj5w';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get('sheetName');

  if (!sheetName) {
    return NextResponse.json({ error: 'sheetName is required' }, { status: 400 });
  }

  try {
    const data = await getSheetData(PRIVILEGES_SHEET_ID, sheetName);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
