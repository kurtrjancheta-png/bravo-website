import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

import { getSessionUser } from '../../../../lib/session';

export async function POST(req) {
  try {
    const user = getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }
    const data = await req.json();
    
    // The Apps Script Web App URL
    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzl4NI5OPfQ_fwe1jbfEHGkBeO8ZeI1wKVJXwt7-tJgmJsfFNXGTNWftEiYeMIxZY0/exec";

    if (APPS_SCRIPT_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
      console.warn("Google Apps Script URL is missing! Form submission bypassed.");
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
      throw new Error(result.error || 'Failed to append to Google Sheet');
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Report Submission Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
