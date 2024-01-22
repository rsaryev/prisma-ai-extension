import fs from 'fs/promises';

export const getPrismaSchema = async (pathToSchema: string): Promise<string> => {
  const schema = await fs.readFile(pathToSchema, 'utf-8');
  return schema.replace(/[\n\r]+/g, '');
};
