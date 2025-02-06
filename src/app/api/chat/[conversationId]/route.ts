import { NextRequest, NextResponse } from 'next/server';

import { verifyUser } from '@/server/actions/user';
import {
  dbGetConversation,
  dbGetConversationMessages,
} from '@/server/db/queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await verifyUser();
  const userId = session?.data?.data?.id;
  const publicKey = session?.data?.data?.publicKey;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!publicKey) {
    console.error('[chat/route] No public key found');
    return NextResponse.json({ error: 'No public key found' }, { status: 400 });
  }

  const { conversationId } = await params;

  if (!conversationId) {
    return NextResponse.json(
      { error: 'Missing conversationId' },
      { status: 401 },
    );
  }

  try {
    const messages = await dbGetConversationMessages({
      conversationId,
    });

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation messages not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error(
      `[chat/[conversationId]/route] Error fetching conversation: ${error}`,
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
