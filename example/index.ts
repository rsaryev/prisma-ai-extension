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
    `find user with id ${1} and include posts and include comments and likes to each post and comment`,
  );
  console.log(user);
  // {
  //     "id": 1,
  //     "email": "test@example.com",
  //     "name": "John Doe",
  //     "roleId": 1,
  //     "posts": [
  //     {
  //         "id": 1,
  //         "createdAt": "2024-01-20T00:53:40.729Z",
  //         "updatedAt": "2024-01-20T00:53:40.729Z",
  //         "title": "My First Post",
  //         "content": "This is my first post",
  //         "published": true,
  //         "authorId": 1,
  //         "comments": [
  //             {
  //                 "id": 1,
  //                 "createdAt": "2024-01-20T00:53:41.928Z",
  //                 "updatedAt": "2024-01-20T00:53:41.928Z",
  //                 "content": "This is a comment",
  //                 "authorId": 1,
  //                 "postId": 1,
  //                 "likes": [
  //                     {
  //                         "id": 2,
  //                         "createdAt": "2024-01-20T00:53:42.910Z",
  //                         "updatedAt": "2024-01-20T00:53:42.910Z",
  //                         "authorId": 1,
  //                         "postId": null,
  //                         "commentId": 1
  //                     }
  //                 ]
  //             }
  //         ],
  //         "likes": [
  //             {
  //                 "id": 1,
  //                 "createdAt": "2024-01-20T00:53:42.852Z",
  //                 "updatedAt": "2024-01-20T00:53:42.852Z",
  //                 "authorId": 1,
  //                 "postId": 1,
  //                 "commentId": null
  //             }
  //         ]
  //     }
  // ]
  // }
})();
