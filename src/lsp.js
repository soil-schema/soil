import JsonRpcServer from './json-rpc/Server.js'
import { Core, installListeners } from './language-server/core.js'

try {
  const core = new Core()
  core.makeGlobalConsole()

  const server = new JsonRpcServer(core)

  installListeners(server)

  server.pipe(process.stdout)
  server.listen(process.stdin)
} catch (error) {
  core.logger.log(error.message)
  process.exit(1)
}