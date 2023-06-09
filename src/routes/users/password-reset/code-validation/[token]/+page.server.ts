import type { Actions, PageServerLoad } from './$types';
import { router } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import { TRPCError } from '@trpc/server';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { redirect } from 'sveltekit-flash-message/server'

const schema = z.object({
  password: z.string().min(8, { message: 'Au moins 8 caractères' }).max(32),
  passwordConfirmation: z.string(),
});

export const load: PageServerLoad = async ({ url }) => {
  const form = await superValidate(schema);
  const email = url.searchParams.get('email');

  return {
    form,
    email,
    index: 100002,
    tabs: [
      {
        href: `users/password-reset/code-validation?email=${email}`,
        key: 'users/password-reset/code-validation',
        label: 'mise à jour'
      }
    ]
  }
};

export const actions: Actions = {
  default: async (event) => {
    const { token } = event.params;

    const { request } = event;
    const form = await superValidate(request, schema);

    const { password, passwordConfirmation } = form.data;

    if (password != passwordConfirmation) {
      setError(form, 'passwordConfirmation', 'Ne correspond pas.');
    }

    if (!form.valid) {
      return message(form, 'Champs non valide :(');
    }

    try {
      await router.createCaller(await createContext(event)).users.resetPassword({ token, password });
      throw redirect(302, '/users/login', 'Mot de passe mis à jour !', event);
    } catch (error) {
      if (error instanceof TRPCError && error.cause?.message === "EXPIRED_TOKEN") {
        throw redirect(302, '/users/password-reset?expired=true');
      }
      if (error instanceof TRPCError && error.cause?.message === "INVALID_TOKEN") {
        throw redirect(302, '/users/password-reset?invalid=true');
      }
      throw error;
    }

  }
};