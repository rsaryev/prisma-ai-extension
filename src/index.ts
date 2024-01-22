import { Prisma } from '@prisma/client';
import { generatePrismaQuery } from './generate-prisma-query';
import { PrismaAIArgs } from './type';
import { getPrismaSchema } from './get-prisma-schema';
import { logger } from './logger';
import { PrismaAIError } from './error';

const prismaNotReadonlyMethods = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'];

export const PrismaAI = ({ model, retry = true, debug = false, pathToSchema, readonly = true }: PrismaAIArgs) =>
  Prisma.defineExtension({
    name: 'prisma-ai-extension',
    client: {
      async $queryAI<T>(query: string): Promise<T> {
        const ctx: any = Prisma.getExtensionContext(this);
        const schema = await getPrismaSchema(pathToSchema);

        const run = async (error?: string): Promise<T> => {
          const { entity, method, args, isReadonly } = await generatePrismaQuery({ query, schema, error, model });

          try {
            if (readonly && !isReadonly && prismaNotReadonlyMethods.includes(method)) {
              throw new PrismaAIError(`${entity}.${method}(${JSON.stringify(args)}) is not a readonly query`);
            } else if (debug) {
              logger(`${readonly ? '[Readonly] ' : ''}${entity}.${method}(${JSON.stringify(args)})`);
            }

            return await ctx[entity][method](args);
          } catch (e: any) {
            if (e instanceof PrismaAIError) {
              throw e;
            } else if (retry) {
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
