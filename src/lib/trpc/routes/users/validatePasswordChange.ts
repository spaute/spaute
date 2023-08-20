import { z } from "zod";
import { validateOneTimePassword } from "./utils/validateOneTimePassword";
import { createToken } from "./utils/createToken";
import { verifiedProcedure } from "$lib/trpc/procedures/verifiedProcedure";

const schema = z.object({ password: z.string() });

export const validatePasswordChange = verifiedProcedure
  .input(schema)
  .mutation(async ({ input, ctx }) => {
    const { user } = ctx;
    await validateOneTimePassword(user.email, input.password);

    const token = await createToken(user.userId);

    return { token };
  });