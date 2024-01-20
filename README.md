# Prisma AI Extension

This project is a powerful extension for Prisma Client designed to seamlessly integrate the OpenAI API for generating Prisma queries from natural language inputs.

## Installation

Install the extension by executing the following command in your terminal:

```bash
npm install --save prisma-ai-extension
```

## Usage

Incorporate the extension into your code by importing it and passing it to the `PrismaClient` constructor. Here's an example in TypeScript:

```ts
import { PrismaClient, User } from '@prisma/client';
import { PrismaAI } from 'prisma-ai-extension';

const prisma = new PrismaClient({
    errorFormat: 'pretty',
}).$extends(
    PrismaAI({
        model: 'gpt-3.5-turbo',
        retry: true,
        debug: true,
        pathToSchema: './prisma/schema.prisma',
    }),
);

(async () => {
  // User.findUnique({"where":{"id":1},"include":{"posts":{"include":{"comments":true,"likes":true}}}})
  const user = await prisma.$queryAI<User>(
        `find user with id 1 and include posts and include comments and likes to each post and comment`,
    );
    console.log(user);
})();
```