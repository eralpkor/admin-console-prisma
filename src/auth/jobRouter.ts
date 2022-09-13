import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { Router } from 'express';
const router = Router();
import url from 'url'
const querystring = require('querystring')
var timestamp = new Date().toLocaleDateString();

router.get('/jobs', async (req, res) => {
  const filter = req.originalUrl
  const parsedUrl = url.parse(filter);
  const parsedQs = await querystring.parse(parsedUrl.query);
  const search = await JSON.parse(parsedQs.filter)
  const order = await JSON.parse(parsedQs.sort)
  const range = await JSON.parse(parsedQs.range)

  // get all jobs, pagination, filter and sorting included
  const jobs = await prisma.job.findMany({
    skip: range[0],
    take: range[1],
    orderBy: [
      {
        id: order[1].toLowerCase()
      },
      {
        userId: order[1].toLowerCase()
      }
    ],
    where: {
      OR: [
        {
          title: {
            contains: search.title,
            mode: 'insensitive'
          },
        },
        {
          description: {
            contains: search.description,
            mode: 'insensitive'
          }
        },
        
      ],
    }
  })

  try {
    if (!jobs.length) {
      res.status(400).json({ message: 'No jobs yet'})
    } else {
      res.setHeader(`Content-Range`, jobs.length);
      res.status(200).json(jobs)
    }
  } catch (error) {
    console.log("jobs error ", error);
    res.status(500).json({ error: 'server error '})
  }
})

// get single job
router.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  
  const job = await prisma.job.findUnique({
    where: {
      id: +id,
    }
  })

  try {
    if (job) {
      res.status(200).json(job);
    } else {
      res.status(400).json({ message: "That job does not exist" });
    }
  } catch (error) {
    console.log("Server error ", error);
    res.status(500).json({ error: "Server error " });
  }
})

// Create new jobs
router.post(`/jobs`, async (req, res) => {
  const job = req.body

  try {
    const newJob = await prisma.job.create({
      data: {
        title: job.title,
        description: job.description,
        inProgress: job.inProgress,
        userId: 1,
        adminId: 1,
        customerId: 1,
        dueDate: job.dueDate,
        total: job.total,
        balance: job.total - job.amountPaid,
        updatedAt: timestamp,
        payment: {
          create: [
            {
              updatedAt: timestamp,
              userId: job.userId,
              editedBy: 1,
              amountPaid: job.amountPaid,
              paymentType: job.paymentType,
              checkNumber: job.checkNumber,
            }
          ]
        },
        comment: {
          create: [
            {
              updatedAt: timestamp,
              comment: job.comment,
              userId: job.userId,
              editedBy: job.adminId,
            }
          ]
        }
      }
    })
    res.status(201).json(newJob)
  } catch (error) {
    console.log("Server error ", error);
    res.status(500).json({ error: "Server error " });
  }
})

// Edit a single job
router.put("/jobs/:id", async (req, res) => {
  const changes = req.body
  const { id } = req.params

  if (Object.keys(changes).length === 0) {
    res.status(422).json({ error: "Request body cannot be empty." });
  }

  const job = await prisma.job.findUnique({
    where: {
      id: +id,
    }
  })

  try {
    if (job) {
      const newJob = await prisma.job.update({
        where: { id: +id },
        data: {
          title: changes.title,
          description: changes.description,
          inProgress: changes.inProgress,
          updatedAt: timestamp,
          dueDate: changes.dueDate,
          userId: 1,
          adminId: 1,
          customerId: 1,
          total: changes.total,
          balance: changes.total - changes.amountPaid,

          // Payment: {
          //   update: {
          //     where: { jobId: +id},
          //     data: {
          //       updatedAt: timestamp,
          //       paymentType: changes.paymentType,
          //       checkNumber: changes.checkNumber,
          //       amountPaid: changes.amountPaid,
          //       editedBy: changes.editedBy,
          //       userId: changes.userId,
          //     }
          //   }
          // }
        },
      })
      console.log(newJob);
      res.status(201).json(newJob)
    } else {
      res.status(400).json({ message: "That job does not exist" });
    }
  } catch (error) {
    console.log("Server error ", error);
    res.status(500).json({ error: "Server error " });
  }

})

export default router
