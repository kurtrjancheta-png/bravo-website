import { NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.CELLPHONE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycby_bRO_-U_zXj79oXeKZVlKVV7y1w1XA94M9-bYUwy1BvToEt_E-dahL9W5wj7poMPU/exec';

export async function POST(req) {
  try {
    const changes = await req.json();

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

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error proxying to Apps Script:', error);
    return NextResponse.json({ success: false, error: 'Failed to proxy request.' }, { status: 500 });
  }
}
