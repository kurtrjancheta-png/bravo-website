import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing drive ID' }, { status: 400 });
    }

    const url = `https://docs.google.com/uc?export=download&id=${id}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch file from Google Drive' }, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    
    const response = new NextResponse(arrayBuffer);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (err) {
    console.error('Drive proxy API error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
