import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { router } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import { TRPCError } from '@trpc/server';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "$env/static/private";

import { building } from "$app/environment";

let redis: Redis;
let sendRatelimit: Ratelimit;
let verifyRatelimit: Ratelimit;

if (!building) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });

  verifyRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "10 s"),
  });

  sendRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "60 s"),
  });
}

const schema = z.object({});

const passwordSchema = z.object({
  password: z.string()
});

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  const { user } = await locals.auth.validateUser();

  if (!user) {
    throw redirect(302, "/users/login");
  }

  const form = await superValidate(schema);
  const expired = url.searchParams.get('expired');
  const invalid = url.searchParams.get('invalid');

  if (expired) {
    const error = 'Le code de validation a expiré !';
    setError(form, "", error);
  }

  if (invalid) {
    const error = 'Le code de validation n\'est pas valide !';
    setError(form, "", error);
  }

  const passwordForm = await superValidate(passwordSchema, { id: 'passwordForm' });

  const fromPathname = cookies.get('fromPathname');

  return {
    form,
    passwordForm,
    fromPathname: fromPathname ?? '/gigs',
    email: user.email,
    emailVerified: user.emailVerified,
    tabs: [
      {
        href: '/email-verification',
        key: '/email-verification',
        label: 'vérification'
      }
    ],
    index: 10000
  }
};

export const actions: Actions = {
  send: async (event) => {

    const { request } = event;
    const form = await superValidate(request, schema);

    const ip = event.getClientAddress();
    const rateLimitAttempt = await sendRatelimit.limit(ip);
    if (!rateLimitAttempt.success) {
      const timeRemaining = Math.floor(
        (rateLimitAttempt.reset - new Date().getTime()) / 1000
      );
      setError(
        form,
        "",
        `Attends ${timeRemaining} secondes pour un nouvel email !`,
        {
          status: 429
        }
      );
      return message(form, 'Pas si vite !');
    }

    try {
      await router.createCaller(await createContext(event)).users.sendVerificationEmail();
      return message(form, 'Email envoyé !');
    } catch (error) {
      if (!(error instanceof TRPCError)) {
        throw error;
      }
      setError(
        form,
        "",
        error.message
      );
      return message(form, 'Outch !');
    }

  },
  verify: async (event) => {
    const { request } = event;

    const form = await superValidate(request, passwordSchema, { id: 'passwordForm' });

    const ip = event.getClientAddress();
    const rateLimitAttempt = await verifyRatelimit.limit(ip);
    if (!rateLimitAttempt.success) {
      const timeRemaining = Math.floor(
        (rateLimitAttempt.reset - new Date().getTime()) / 1000
      );
      setError(
        form,
        "",
        `Trop de tentatives ! Essais à nouveau dans ${timeRemaining} secondes`,
        {
          status: 429
        }
      );
      return message(form, 'Pas si vite !');
    }

    try {
      await router.createCaller(await createContext(event)).users.verifyEmail({ password: form.data.password });
      throw redirect(302, '/email-verification');
    } catch (error) {
      if (error instanceof TRPCError && error.cause?.message === "EXPIRED_TOKEN") {
        throw redirect(302, '/email-verification?expired=true');
      }
      if (error instanceof TRPCError && error.cause?.message === "INVALID_TOKEN") {
        throw redirect(302, '/email-verification?invalid=true');
      }
      throw redirect(302, '/email-verification');
    }

  }
};