import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto, { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-sessionId-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  // app.addHook('preHandler', async (request, reply) => {
  //   console.log('rodei')
  // })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('*')
      return {
        transactions,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies

      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const params = getTransactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id: params.id,
        })
        .first()

      return { transaction }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
        .first()
      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    const createTransactionsBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const body = createTransactionsBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7days
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title: body.title,
      amount: body.type === 'credit' ? body.amount : body.amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
