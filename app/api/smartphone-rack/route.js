import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.CELLPHONE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycby_bRO_-U_zXj79oXeKZVlKVV7y1w1XA94M9-bYUwy1BvToEt_E-dahL9W5wj7poMPU/exec';

export async function POST(req) {
  try {
    const changes = await req.json();

    // Normalize status to strictly match Google Sheets Data Validation rules
    changes.forEach(c => {
      if (c.status) {
        const s = String(c.status).toLowerCase();
        if (s.includes('out')) c.status = 'Logged Out';
        else if (s.includes('in')) c.status = 'Logged In';
        else if (s.includes('confiscat')) c.status = 'Confiscated';
        else if (s.includes('no')) c.status = 'No Smartphone';
      }
    });

    if (!APPS_SCRIPT_URL) {
      console.warn('CELLPHONE_APPS_SCRIPT_URL is not defined.');
      // Simulate success if no URL is set so UI testing doesn't break
      return NextResponse.json({ success: true, message: "URL not configured. Simulating success." });
    }

    // Send the batch array to Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changes),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Apps Script response as JSON. Response text:', text);
      return NextResponse.json({ success: false, error: 'Apps Script returned non-JSON response.', details: text }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error proxying to Apps Script:', error);
    return NextResponse.json({ success: false, error: 'Failed to proxy request.' }, { status: 500 });
  }
}
