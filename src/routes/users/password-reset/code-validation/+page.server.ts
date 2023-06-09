import type { Actions, PageServerLoad } from './$types';
import { router } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import { TRPCError } from '@trpc/server';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { redirect } from '@sveltejs/kit';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "$env/static/private";

import { building } from "$app/environment";

let redis: Redis;
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
}

const schema = z.object({
  password: z.string(),
  email: z.string()
});

export const load: PageServerLoad = async ({ url }) => {
  const form = await superValidate(schema);
  const email = url.searchParams.get('email');
  const expired = url.searchParams.get('expired');
  const invalid = url.searchParams.get('invalid');

  if (expired) {
    const error = 'Le code de récupération a expiré !';
    setError(form, "", error);
  }

  if (invalid) {
    const error = 'Le code de récupération n\'est pas valide !';
    setError(form, "", error);
  }

  return {
    form,
    email,
    tabs: [
      {
        href: 'users/code-validation',
        key: 'users/code-validation',
        label: 'validation'
      }
    ],
    index: 100001
  }
};

export const actions: Actions = {
  default: async (event) => {
    const { request } = event;
    const form = await superValidate(request, schema);

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
      const result = await router.createCaller(await createContext(event)).users.getResetPasswordToken({ password: form.data.password, email: form.data.email });
      throw redirect(302, `/users/password-reset/code-validation/${result.token}?email=${form.data.email}`);
    } catch (error) {
      if (error instanceof TRPCError && error.cause?.message === "EXPIRED_TOKEN") {
        throw redirect(302, `/users/password-reset/code-validation?expired=true&email=${form.data.email}`);
      }
      if (error instanceof TRPCError && error.cause?.message === "INVALID_TOKEN") {
        throw redirect(302, `/users/password-reset/code-validation?invalid=true&email=${form.data.email}`);
      }
      throw error;
    }

  }
};