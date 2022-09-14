import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { Router } from 'express';
const router = Router();
import url from 'url'
const querystring = require('querystring')
var timestamp = new Date().toLocaleDateString()

// GET all payments
router.get('/payment', async (req, res) => {
  let search, order, range
  const filter = req.originalUrl
  const parsedUrl = url.parse(filter);
  const parsedQs = await querystring.parse(parsedUrl.query);

  if (parsedQs.filter) {
    search = await JSON.parse(parsedQs.filter)
  }
  if (parsedQs.sort) {
    order = await JSON.parse(parsedQs.sort)
  }
  if (parsedQs.range) {
    range = await JSON.parse(parsedQs.range)
  }

  const data = await prisma.payment.findMany({
    skip: range[0],
    take: range[1],
    orderBy: [
      {
        id: order[1].toLowerCase()
      },
      {
        userId: order[1].toLowerCase()
      },
      {
        jobId: order[1].toLowerCase()
      }
    ],
    where: {
      OR: [
        {
          checkNumber: {
            contains: search.checkNumber,
            mode: 'insensitive'
          },
        },
      ],
    }
  })

  try {
    if (!data.length) {
      res.status(400).json({ message: 'No payments yet'})
    } else {
      res.setHeader(`Content-Range`, data.length);
      res.status(200).json(data)
    }
  } catch (error) {
    console.log("Payments error ", error)
    res.status(500).json({ error: 'server error '})
  }
})

// Edit payment
router.put('/payment/:id', async (req, res) => {
  const changes = req.body
  const { id } = req.params

  if (Object.keys(changes).length === 0) {
    res.status(422).json({ error: "Request body cannot be empty." });
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: +id
    }
  })

  const job = await prisma.job.findUnique({
    where: { id: payment?.jobId }
  })

  try {
    if (payment && job) {
      const editPayment = await prisma.payment.update({
        where: { id: +id },
        data: {
          updatedAt: timestamp,
          paymentType: changes.paymentType,
          editedBy: changes.editedBy,
          checkNumber: changes.checkNumber,
          amountPaid: changes.amountPaid,
        }
      })

      const paymentTotal = await prisma.payment.aggregate({
        where: { jobId: payment?.jobId },
        _sum: { amountPaid: true  }
      })

      const updateBalance = await prisma.job.update({
        where: { id: job!.id },
        data: {
          updatedAt: timestamp,
          balance: job!.total - paymentTotal._sum.amountPaid!
        }
      })
      res.status(201).json(editPayment)
    } else {
      res.status(400).json({ message: "That payment does not exist" });
    }
  } catch (error) {
    console.log("Server error ", error);
    res.status(500).json({ error: "Server error " });
  }
})

// Add new payment by jobId
router.post('/payment', async (req, res) => {
  const data = req.body

  const user = await prisma.user.findUnique({
    where: { id: data.userId}
  })
  const job = await prisma.job.findUnique({
    where: { id: data.jobId }
  })
  
  try {
    const newPayment = await prisma.payment.create({
      data: {
        updatedAt: timestamp,
        paymentType: data.paymentType,
        editedBy: data.editedBy,
        userId: user!.id,
        checkNumber: data.checkNumber,
        amountPaid: data.amountPaid,
        jobId: job!.id,
      }
    })

    const paymentTotal = await prisma.payment.aggregate({
      where: { jobId: job!.id },
      _sum: { amountPaid: true  }
    })

    const updateBalance = await prisma.job.update({
      where: { id: data!.jobId },
      data: {
        updatedAt: timestamp,
        balance: job!.total - paymentTotal._sum.amountPaid!
      }
    })
    res.status(201).json(newPayment)
  } catch (error) {
    console.log("Server error ", error);
    res.status(500).json({ error: "Server error " });
  }
})

export default router