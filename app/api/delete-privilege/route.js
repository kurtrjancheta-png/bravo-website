import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUser } from '../../../lib/session';
import { logActivity } from '../../../lib/logger';

const DELETED_FILE_PATH = path.join(process.cwd(), 'lib', 'deletedPrivileges.json');

// Helper to read the deleted privileges from the local file
function readDeletedPrivileges() {
  try {
    if (fs.existsSync(DELETED_FILE_PATH)) {
      const data = fs.readFileSync(DELETED_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading deleted privileges file:', err);
  }
  return [];
}

// Helper to write the deleted privileges to the local file
function writeDeletedPrivileges(list) {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(DELETED_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DELETED_FILE_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing deleted privileges file:', err);
    return false;
  }
}

export async function POST(req) {
  try {
    // 1. Authenticate user to ensure only S1/S6/CEIS can delete/create privileges
    const user = getSessionUser(req);
    const isCEIS = user && (user.council === 'S6' || String(user.council || '').toUpperCase().includes('CEIS'));
    const isS1 = user && user.council === 'S1';
    const isAdmin = user && user.role === 'ADMIN';

    if (!user || (!isS1 && !isCEIS && !isAdmin)) {
      logActivity(req, 'Unauthorized Privilege Modification Attempt', { path: '/api/delete-privilege' });
      return NextResponse.json({ success: false, error: 'Unauthorized Administrative Access.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, sheetName, type, date } = body;

    logActivity(req, `Privilege Modification Local: ${action}`, { action, sheetName, type, date });

    let deletedList = readDeletedPrivileges();

    if (action === 'delete') {
      if (!sheetName) {
        return NextResponse.json({ success: false, error: 'sheetName is required for deletion' }, { status: 400 });
      }

      if (!deletedList.includes(sheetName)) {
        deletedList.push(sheetName);
        if (!writeDeletedPrivileges(deletedList)) {
          return NextResponse.json({ success: false, error: 'Failed to write deletion status locally.' }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true, message: 'Privilege deleted locally.' });
    } 
    
    if (action === 'create') {
      if (!type || !date) {
        return NextResponse.json({ success: false, error: 'type and date are required for creation cleanup' }, { status: 400 });
      }

      // Compute potential sheetNames to clean up from the deleted list
      const targetSheetName1 = `${type} ${date}`;
      const targetSheetName2 = `${type} priv ${date}`;
      
      const originalLength = deletedList.length;
      deletedList = deletedList.filter(name => name !== targetSheetName1 && name !== targetSheetName2);

      if (deletedList.length !== originalLength) {
        writeDeletedPrivileges(deletedList);
      }
      
      return NextResponse.json({ success: true, message: 'Privilege active status restored locally.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Error handling delete-privilege API request:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
