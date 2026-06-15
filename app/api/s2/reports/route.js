import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const data = await req.json();
    const filePath = path.join(process.cwd(), 's2_rifle_reports.json');
    
    let reports = [];
    try {
      const fileData = await fs.readFile(filePath, 'utf8');
      reports = JSON.parse(fileData);
    } catch (e) {
      // File might not exist yet
    }
    
    reports.push(data);
    await fs.writeFile(filePath, JSON.stringify(reports, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
