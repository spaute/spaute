import { computePlayability } from "$lib/hook/computePlayability";
import prisma from "$lib/prisma";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const { data } = await request.json();
  const response = await prisma.presence.create({
    data
  });
  await computePlayability(response.gigId);
  return json(response);
}