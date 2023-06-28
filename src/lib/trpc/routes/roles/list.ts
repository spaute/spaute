import { RoleWhereInputSchema } from "$lib/generated/zod";
import prisma from "$lib/prisma";
import { verifiedProcedure } from "$lib/trpc/procedures/verifiedProcedure";

export const list = verifiedProcedure
  .input(RoleWhereInputSchema)
  .query(({ input }) => prisma.role.findMany({
    where: input,
    orderBy: {
      instrument: {
        name: 'asc'
      }
    },
    include: {
      instrument: true
    }
  }));