import { app } from './app'
import { env } from './env'

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('Servidor HTTP em execução')
  })
  .catch((error) => {
    console.log(`Servidor HTTP não iniciou corretamente: ${error}`)
  })
