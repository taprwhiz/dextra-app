import fetch from 'node-fetch';

import { getUserData } from '@/server/actions/user';

const DISCORD_API_BASE_URL = 'https://discordapp.com/api';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ROLE_ID = process.env.DISCORD_ROLE_ID;

export async function POST(req: Request) {
  if (!BOT_TOKEN || !GUILD_ID || !ROLE_ID) {
    throw new Error('Discord environment variables not set');
  }

  const userData = await getUserData();
  const hasEarlyAccess = userData?.data?.data?.earlyAccess;

  if (!hasEarlyAccess) {
    return new Response('User does not have early access', { status: 403 });
  }

  const { userId } = await req.json();

  if (!userId) {
    return new Response('User ID is required', { status: 400 });
  }

  try {
    const url = `${DISCORD_API_BASE_URL}/guilds/${GUILD_ID}/members/${userId}/roles/${ROLE_ID}`;

    await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
      },
    });
    return new Response('Role granted successfully', { status: 200 });
  } catch (error) {
    return new Response('Failed to grant role', { status: 500 });
  }
}
