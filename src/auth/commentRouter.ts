import { Prisma, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { Router } from 'express';
const router = Router();

router.get('/comment', async (req, res) => {
  const comments = await prisma.comment.findMany()

  try {
    if (!comments.length) {
      res.status(400).json({ message: 'No comments yet'})
    } else {
      res.status(200).json(comments)
    }
  } catch (error) {
    console.log("comments error ", error);
    res.status(500).json({ error: 'server error '})
  }
  
})

export default router