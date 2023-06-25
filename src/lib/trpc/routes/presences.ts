import { PresenceGigIdPlayerIdCompoundUniqueInputSchema, PresenceSchema, PresenceWhereInputSchema } from "$lib/generated/zod";
import prisma from "$lib/prisma";
import { t } from "../t";
import { verifiedProcedure } from "../procedures/verifiedProcedure";
import { organizerProcedure } from "../procedures/organizerProcedure";
import { ownerProcedure } from "../procedures/ownerProcedure";
import { Novu } from "@novu/node";
import { NOVU_API_KEY } from "$env/static/private";

export const presences = t.router({
  list: verifiedProcedure.input(PresenceWhereInputSchema).query(async ({ input }) => prisma.presence.findMany({
    where: input,
    include: {
      gig: true,
      player: true
    },
    orderBy: {
      player: {
        name: 'asc'
      }
    }
  })),
  read: verifiedProcedure.input(PresenceGigIdPlayerIdCompoundUniqueInputSchema).query(async ({ input }) => {
    const presence = await prisma.presence.findUnique({
      where: {
        gigId_playerId: input
      }
    });
    return presence;
  }),
  create: verifiedProcedure.input(
    PresenceSchema.omit({ id: true, isOrganizer: true })
  ).mutation(async ({ input, ctx }) => {
    const { playerId, gigId, ...rest } = input;
    const presence = await prisma.presence.create({
      data: {
        ...rest,
        gig: {
          connect: {
            id: gigId
          }
        },
        player: {
          connect: {
            id: playerId
          }
        },
      }
    });

    const novu = new Novu(NOVU_API_KEY);
    const spamTopicKey = `gig:spam:${gigId}`;

    await novu.topics.removeSubscribers(spamTopicKey, {
      subscribers: [ctx.user.userId],
    });

    return presence;
  }),
  update: ownerProcedure.input(PresenceSchema.omit({ id: true, isOrganizer: true }).strict()).mutation(async ({ input }) => {
    const { playerId, gigId, ...data } = input;

    const presence = await prisma.presence.update({
      where: {
        gigId_playerId: {
          gigId,
          playerId
        }
      },
      data,
    });
    return presence;
  }),
  makeOrganizer: organizerProcedure.input(
    PresenceGigIdPlayerIdCompoundUniqueInputSchema
  ).mutation(async ({ input }) => prisma.presence.update({
    where: {
      gigId_playerId: input
    },
    data: {
      isOrganizer: true
    }
  }))
})