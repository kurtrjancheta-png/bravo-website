import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    
    // The Apps Script Web App URL
    // We expect the user to set this in their environment, or replace this string.
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL_S1_SICK_CALL || "https://script.google.com/macros/s/AKfycbz3ea8N3jkQl7OR_793R0_A5gOpf87kKF3gKjdPt_QoH1lzkHcW-fLfbqUZGa9lM2Eo/exec";

    if (APPS_SCRIPT_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
      console.warn("Google Apps Script URL is missing! Sick Call operation bypassed.");
      // Temporarily succeed so the UI doesn't break while we wait for the URL
      return NextResponse.json({ success: true, warning: "APPS_SCRIPT_URL not configured" });
    }

    // Forward the data to Google Sheets via the Web App
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Google Sheet');
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sick Call Submission Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
