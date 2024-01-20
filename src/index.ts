import { Prisma } from '@prisma/client';
import OpenAI from 'openai/index';
import fs from 'fs/promises';
import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';

const openAiClient = new OpenAI();
interface PrismaAIArgs {
  model: string;
  retry?: boolean;
  debug?: boolean;
  pathToSchema: string;
}

export const PrismaAI = ({ model, retry = true, debug = false, pathToSchema }: PrismaAIArgs) =>
  Prisma.defineExtension({
    name: 'prisma-ai-extension',
    client: {
      async $queryAI<T>(query: string): Promise<T> {
        // eslint-disable-next-line
        const ctx: any = Prisma.getExtensionContext(this);
        const schema = await getPrismaSchema({ pathToSchema });

        const run = async (error?: string): Promise<T> => {
          const { entity, method, args } = await generatePrismaQuery({ query, schema, error, model });

          try {
            if (debug) {
              logger(`${entity}.${method}(${JSON.stringify(args)})`);
            }
            return await ctx[entity][method](args);
            // eslint-disable-next-line
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

function logger(message: string) {
  console.log(`[Prisma AI]`, message);
}

async function getPrismaSchema({ pathToSchema }: { pathToSchema: string }): Promise<string> {
  const schema = await fs.readFile(pathToSchema, 'utf-8');
  return schema.replace(/[\n\r]+/g, '');
}

async function generatePrismaQuery({
  query,
  schema,
  error,
  model,
}: {
  query: string;
  schema: string;
  error?: string;
  model: string;
}): Promise<{
  entity: string;
  method: string;
  args: object;
}> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: schema },
    { role: 'system', content: new Date().toISOString() },
    { role: 'user', content: query },
  ];

  if (error) {
    messages.push({ role: 'system', content: error });
  }

  const aiRunner = await openAiClient.chat.completions.create({
    functions: [
      {
        name: 'generate',
        description:
          'Run a Prisma method. For example: {"model": "User", "method": "findUnique", "args": {"where": {"id": 1}}}',
        parameters: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description: 'For example: User, Post, Comment, Like',
            },
            method: {
              type: 'string',
              description: 'For example: findMany, findUnique, create, update, delete, aggregate',
            },
            args: {
              type: 'object',
              properties: {
                where: {
                  type: 'object',
                },
                data: {
                  type: 'object',
                },
                include: {
                  type: 'object',
                },
                select: {
                  type: 'object',
                },
                take: {
                  type: 'number',
                },
                skip: {
                  type: 'number',
                },
                orderBy: {
                  type: 'object',
                },
              },
            },
          },
          required: ['entity', 'method', 'args'],
        },
      },
    ],
    model,
    messages: messages,
    function_call: {
      name: 'generate',
    },
  });

  return JSON.parse(aiRunner.choices[0]?.message?.function_call?.arguments || '{}');
}
