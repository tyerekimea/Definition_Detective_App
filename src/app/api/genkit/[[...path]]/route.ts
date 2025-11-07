
import { createApiHandler } from '@genkit-ai/next';
import '@/ai/flows/smart-word-hints';
import '@/ai/flows/game-sounds-flow';
import { appRoute } from "@genkit-ai/next";
import { z } from "zod";



export const POST = appRoute({
    schema: z.any(),
    handler: async (request) => {
      return { status: "ok" };
    },
  });
