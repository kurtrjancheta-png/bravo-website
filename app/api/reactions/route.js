import { NextResponse } from 'next/server';
import { updateReaction, getReactions } from '../../../lib/reactionsDb';
import { getSessionUser } from '../../../lib/session';

export async function POST(req) {
  try {
    // Authenticate the user session
    const user = getSessionUser(req);
    if (!user || !user.username) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, emojiType, action } = await req.json();

    if (!cardId || !emojiType || !action) {
      return NextResponse.json({ success: false, error: 'Missing required parameters.' }, { status: 400 });
    }

    if (action !== 'react' && action !== 'unreact') {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }

    // Pass the authenticated username to verify/bind the reaction
    const updatedCardReactions = await updateReaction(cardId, emojiType, user.username, action);
    return NextResponse.json({ success: true, reactions: updatedCardReactions });
  } catch (error) {
    console.error('Error in reactions API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reactions = await getReactions();
    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    console.error('Error in reactions API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
