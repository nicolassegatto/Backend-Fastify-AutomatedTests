import {
  expect,
  test,
  beforeAll,
  afterAll,
  describe,
  it,
  beforeEach,
} from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('transacton routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('user can creat new trasnsaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New Transaction Test',
      amount: 5000,
      type: 'credit',
    })
    expect(response.statusCode).toEqual(201)
  })

  // no lugar do test posso usar o it
  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction Test',
        amount: 5000,
        type: 'credit',
      })
    const cookies = createTransactionResponse.get('Set-Cookie')

    const ListTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(ListTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction Test',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get specific transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction Test',
        amount: 5000,
        type: 'credit',
      })
    const cookies = createTransactionResponse.get('Set-Cookie')

    const ListTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = ListTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction Test',
        amount: 5000,
      }),
    )
  })

  it('should be able to get a summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summartResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summartResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
