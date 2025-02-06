const DISCORD_API_BASE_URL = 'https://discordapp.com/api';

/**
 * Grants a role to a user in a Discord guild if they have early access.
 *
 * @param userId
 * @returns
 */
export async function grantDiscordRole(userId: string): Promise<void> {
  const response = await fetch('/api/discord/grant-role', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to grant role: ${response.statusText}`);
  }
}

/**
 * Gets the user id
 *
 * @param accessToken
 * @returns user ID
 */
export async function getUserID(accessToken: string): Promise<string> {
  const url = `${DISCORD_API_BASE_URL}/users/@me`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get current guild member: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.id;
}
