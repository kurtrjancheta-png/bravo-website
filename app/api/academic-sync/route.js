import { NextResponse } from 'next/server';

export async function POST(req) {
  const syncUrl = process.env.ACADEMIC_APPS_SCRIPT_URL;
  if (!syncUrl) {
    return NextResponse.json({ success: false, error: 'ACADEMIC_APPS_SCRIPT_URL is not configured.' }, { status: 500 });
  }

  try {
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ triggeredBy: 'Web Dashboard' }),
      redirect: 'follow'
    });

    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch(e) {
      json = { status: 'success', rawResponse: text };
    }

    return NextResponse.json({ success: true, response: json });
  } catch (error) {
    console.error('Failed to trigger academic sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
