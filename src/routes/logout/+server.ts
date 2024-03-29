import { auth } from '$lib/lucia';
import { redirect } from 'sveltekit-flash-message/server';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const session = await event.locals.auth.validate();
  if (session) {
    await auth.invalidateSession(session.sessionId); // invalidate session
  }
  event.locals.auth.setSession(null); // remove cookie

  throw redirect(302, '/users/login', 'Deconnecté !', event);
};
