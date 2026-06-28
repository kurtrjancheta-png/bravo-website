import { NextResponse } from 'next/server';

const PUSH_APPS_SCRIPT_URL = process.env.PUSH_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwqZ-placeholder-url/exec';

export async function POST(req) {
  try {
    const { subscription, userAgent } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ success: false, error: 'Invalid subscription object.' }, { status: 400 });
    }

    // Build the payload for the Apps Script
    const payload = {
      action: 'subscribe',
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || ''
    };

    if (PUSH_APPS_SCRIPT_URL.includes('placeholder')) {
      console.warn('PUSH_APPS_SCRIPT_URL is not fully configured yet. Simulating success.');
      return NextResponse.json({ success: true, message: 'Subscription simulated (no URL configured).' });
    }

    const response = await fetch(PUSH_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Apps Script response. Text:', text);
      return NextResponse.json({ success: false, error: 'Invalid response from Sheets proxy.' }, { status: 500 });
    }

    const isSuccess = result.status === 'success' || result.success === true;
    return NextResponse.json({
      success: isSuccess,
      message: result.message || '',
      error: !isSuccess ? (result.message || 'Failed to save subscription.') : undefined
    });
  } catch (error) {
    console.error('Error handling subscription registration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
