export interface PrismaAIArgs {
  model: string;
  retry?: boolean;
  debug?: boolean;
  pathToSchema: string;
}

export interface RequestGeneratePrismaQuery {
  query: string;
  schema: string;
  error?: string;
  model: string;
}

export interface ResponseGeneratePrismaQuery {
  entity: string;
  method: string;
  args: object;
}
