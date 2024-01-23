import { Prisma } from '@prisma/client';
import { generatePrismaQuery } from './generate-prisma-query';
import { PrismaAIArgs } from './type';
import { getPrismaSchema } from './get-prisma-schema';
import { logger } from './logger';
import { PrismaAIError } from './error';
import { DMMF } from '@prisma/client/runtime/library';

const ModelAction = DMMF.ModelAction;

const prismaNotReadonlyMethods = new Set([
  ModelAction.create,
  ModelAction.update,
  ModelAction.upsert,
  ModelAction.delete,
]);
const queriesCache = new Map();

export const PrismaAI = ({
  model,
  retry = true,
  debug = false,
  pathToSchema,
  readonly = true,
  cache = false,
}: PrismaAIArgs) =>
  Prisma.defineExtension({
    name: 'prisma-ai-extension',
    client: {
      async $queryAI<T>(query: string): Promise<T> {
        const ctx: any = Prisma.getExtensionContext(this);
        const schema = await getPrismaSchema(pathToSchema);
        const attemptQueryExecution = async (error?: string): Promise<T> => {
          const cachedQuery = queriesCache.get(query);
          const { entity, method, args, isReadonly } =
            cache && cachedQuery ? cachedQuery : await generatePrismaQuery({ query, schema, error, model });

          try {
            if (readonly && !isReadonly && prismaNotReadonlyMethods.has(method)) {
              throw new PrismaAIError(`${entity}.${method}(${JSON.stringify(args)}) is not a readonly query`);
            } else if (debug) {
              logger(
                `${readonly ? '[Readonly] ' : ''}${cachedQuery ? '[Cache] ' : ''}${entity}.${method}(${JSON.stringify(args)})`,
              );
            }

            const result = await ctx[entity][method](args);
            if (cache && !cachedQuery) {
              queriesCache.set(query, { entity, method, args, isReadonly });
            }
            return result;
          } catch (e: any) {
            if (e instanceof PrismaAIError) {
              throw e;
            } else if (retry) {
              return await attemptQueryExecution(e.message.replace(/[\n\r]+/g, ''));
            } else {
              throw e;
            }
          }
        };

        return await attemptQueryExecution();
      },
    },
  });
