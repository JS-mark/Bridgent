import process from 'node:process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  const alice = await prisma.user.create({
    data: { email: 'alice@example.com', name: 'Alice', age: 31 },
  })
  const bob = await prisma.user.create({
    data: { email: 'bob@example.com', name: 'Bob', age: 27 },
  })

  const post = await prisma.post.create({
    data: { title: 'Hello, Bridgent', content: 'First post.', published: true, authorId: alice.id },
  })
  await prisma.post.create({
    data: { title: 'Draft notes', published: false, authorId: bob.id },
  })

  await prisma.comment.create({ data: { body: 'Welcome!', postId: post.id, authorId: bob.id } })
  await prisma.comment.create({ data: { body: 'Looks good.', postId: post.id, authorId: alice.id } })

  console.log('Seeded.')
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
