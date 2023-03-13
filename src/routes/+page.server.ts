import prisma from '$lib/prisma'
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const bands = await prisma.band.findMany();
  return {
    bands
  }
}