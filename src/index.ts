import { Prisma } from '@prisma/client';
import { generatePrismaQuery } from './generate-prisma-query';
import { PrismaAIArgs } from './type';
import { getPrismaSchema } from './get-prisma-schema';
import { logger } from './logger';

export const PrismaAI = ({ model, retry = true, debug = false, pathToSchema }: PrismaAIArgs) =>
  Prisma.defineExtension({
    name: 'prisma-ai-extension',
    client: {
      async $queryAI<T>(query: string): Promise<T> {
        const ctx: any = Prisma.getExtensionContext(this);
        const schema = await getPrismaSchema(pathToSchema);

        const run = async (error?: string): Promise<T> => {
          const { entity, method, args } = await generatePrismaQuery({ query, schema, error, model });

          try {
            if (debug) {
              logger(`${entity}.${method}(${JSON.stringify(args)})`);
            }
            return await ctx[entity][method](args);
          } catch (e: any) {
            if (retry) {
              return await run(e.message.replace(/[\n\r]+/g, ''));
            } else {
              throw e;
            }
          }
        };

        return await run();
      },
    },
  });
