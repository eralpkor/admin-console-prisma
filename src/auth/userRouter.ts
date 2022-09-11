import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { Router } from 'express';
const router = Router();

router.post(`/user`, async (req, res) => {
  const user = req.body;
  // console.log(user);
  const userExist = await prisma.user.findUnique({
    where: {
      username: user.username,
    }
  })

  if (userExist) {
    res.status(403).json({ error: 'user already exist...'})
  } else {
    const newUser = await prisma.user.create({
      data: user
    })
    res.status(201).json(newUser)
    }
})

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

export default router
