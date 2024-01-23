export interface PrismaAIArgs {
  model: string;
  retry?: boolean;
  debug?: boolean;
  pathToSchema: string;
  readonly?: boolean;
  cache?: boolean;
}

export interface RequestGeneratePrismaQuery {
  query: string;
  schema: string;
  error?: string;
  model: string;
}

export interface ResponseGeneratePrismaQuery {
  model: string;
  method: string;
  args: object;
  isReadonly: boolean;
}
