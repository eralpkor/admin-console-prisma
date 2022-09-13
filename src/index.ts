import { Prisma, PrismaClient } from '@prisma/client'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import userRouter  from './auth/userRouter'
import jobRouter from './auth/jobRouter'
import commentRouter from './auth/commentRouter'
import customerRouter from "./auth/customerRouter";

const app = express()

let corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  exposedHeaders: ["Content-Range"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}));

app.use('/api', userRouter)
app.use('/api', jobRouter)
app.use('/api', commentRouter)
app.use('/api', customerRouter)

const PORT = 5000
const server = app.listen(PORT, () =>
  console.log(`
🚀 Server ready at: http://localhost:${PORT}
⭐️`),
)

app.get("/", (req, res) => {
  res.send("<h2>Let's cook something! 🌽🥕 😄</h2>");
});