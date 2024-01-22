export class PrismaAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaAIError';
  }
}
