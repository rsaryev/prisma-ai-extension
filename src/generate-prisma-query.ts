import { ChatCompletionMessageParam } from 'openai/src/resources/chat/completions';
import { openaiClient } from './openai-client';
import { RequestGeneratePrismaQuery, ResponseGeneratePrismaQuery } from './type';
import { DMMF } from '@prisma/client/runtime/library';

const ModelAction = DMMF.ModelAction;

const buildMessages = ({ query, schema, error }: RequestGeneratePrismaQuery): ChatCompletionMessageParam[] => {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: schema },
    { role: 'system', content: new Date().toISOString() },
    { role: 'user', content: query },
  ];
  error ? messages.push({ role: 'system', content: error }) : null;
  return messages;
};

const buildFunctionParameters = () => ({
  type: 'object',
  properties: {
    entity: { type: 'string', description: 'For example: User, Post, Comment, Like' },
    method: { type: 'string', enum: Object.values(ModelAction) },
    args: {
      type: 'object',
      properties: {
        where: { type: 'object' },
        data: { type: 'object' },
        include: { type: 'object' },
        select: { type: 'object' },
        take: { type: 'number' },
        skip: { type: 'number' },
        orderBy: { type: 'object' },
      },
    },
    isReadonly: {
      type: 'boolean',
      description: 'If true, the extension will not execute any methods that modify data',
    },
  },
  required: ['entity', 'method', 'args', 'isReadonly'],
});

export const generatePrismaQuery = async (
  request: RequestGeneratePrismaQuery,
): Promise<ResponseGeneratePrismaQuery> => {
  const aiRunner = await openaiClient.chat.completions.create({
    functions: [
      {
        name: 'generate',
        description:
          'Run a Prisma method. For example: {"model": "User", "method": "findUnique", "args": {"where": {"id": 1}}}',
        parameters: buildFunctionParameters(),
      },
    ],
    model: request.model,
    messages: buildMessages(request),
    function_call: { name: 'generate' },
  });

  return JSON.parse(aiRunner.choices[0]?.message?.function_call?.arguments || '{}');
};
