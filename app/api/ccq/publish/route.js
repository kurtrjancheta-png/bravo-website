import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { scriptUrl, ...payload } = body;
    
    if (!scriptUrl) {
      return NextResponse.json({ success: false, error: 'Apps Script URL is missing.' }, { status: 400 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets Web App responded with status: ${response.status}. Details: ${errorText}`);
    }

    const resText = await response.text();
    let result;
    try {
      result = JSON.parse(resText);
    } catch (parseErr) {
      // If it's HTML, return the raw response details to help debug authorization/compilation issues
      console.error("Non-JSON response from Google Apps Script:", resText);
      throw new Error(`Google Apps Script did not return JSON. Response started with: ${resText.substring(0, 300)}`);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("CCQ Publish Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
