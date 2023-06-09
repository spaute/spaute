import type { Actions, PageServerLoad } from './$types';
import { router } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';
import { z } from 'zod';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { TRPCError } from '@trpc/server';

const updateSchema = z.object({
  playerId: z.string(),
  ids: z.array(z.string()),
  playables: z.array(z.boolean())
});

const deleteSchema = z.object({
  playerId: z.string(),
  id: z.string()
})

export const load: PageServerLoad = async (event) => {
  const { currentPlayer } = await event.parent();
  const caller = router.createCaller(await createContext(event));
  const roles = await caller.roles.list({ playerId: currentPlayer.id });
  const updateForm = () => superValidate({
    playables: roles.map(role => role.playable)
  }, updateSchema, { id: 'updateForm' })
  const deleteForm = () => superValidate(deleteSchema, { id: 'deleteForm' });

  return {
    updateForm: updateForm(),
    deleteForm: deleteForm(),
    roles,
    index: 1000
  }
}

export const actions: Actions = {
  update: async (event) => {
    const { request } = event;

    const form = await superValidate(request, updateSchema, { id: 'updateForm' });

    if (!form.valid) {
      return message(form, 'Champs non valide :(');
    }

    try {
      const caller = router.createCaller(await createContext(event));
      await Promise.all(
        form.data.playables.map((playable, index) => caller.roles.update({
          id: form.data.ids[index] as string,
          playable,
          playerId: form.data.playerId
        }))
      );
      return message(form, 'Pupitre mise à jour :)');
    } catch (error) {
      if (!(error instanceof TRPCError)) {
        throw error;
      }
      setError(
        form,
        "",
        error.message
      );
      return message(form, 'Impossible de mettre à jour :(');
    }
  },
  delete: async (event) => {
    const { request } = event;
    const form = await superValidate(request, deleteSchema, { id: 'deleteForm' });

    try {
      await router.createCaller(await createContext(event)).roles.delete(form.data);
      return message(form, 'Bye bye le pupitre :)');
    } catch (error) {
      if (!(error instanceof TRPCError)) {
        throw error;
      }
      setError(
        form,
        "",
        error.message
      );
      return message(form, 'Echec :(');
    }
  }
}