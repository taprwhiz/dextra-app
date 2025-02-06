import { NextRequest, NextResponse } from 'next/server';

import { verifyUser } from '@/server/actions/user';
import { dbDeleteAction, dbUpdateAction } from '@/server/db/queries';

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyUser();
    const userId = session?.data?.data?.id;

    const id = req.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dbDeleteAction({ id, userId });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to delete action' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifyUser();
    const userId = session?.data?.data?.id;

    const id = req.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const result = await dbUpdateAction({ id, userId, data });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update action' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', success: false },
      { status: 500 },
    );
  }
}
