import express from "express"
import https from "https"
import fs from "fs"
import path from "path"
import helmet from "helmet"
import session from './src/redis.js'
import config from "./config/config.js"
import database from "./connection/database.js"
import * as response from './src/response.js'
import userRouter from './v1/user/user.router.js'
import freelancerRouter from './v1/freelancer/freelancer.router.js'
import clientRouter from './v1/client/client.router.js'

const app = express()

// global variables in app
app.set('database', database) // db connection

// sets default headers
app.use(helmet())

// trusts apache2 proxy (first proxy)
app.set('trust proxy', 1)

// session config
app.use(session);

// enables json mode
app.use(express.json())

// handles json errors
app.use(function(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return response.system(res, err)
  }
})

// app base routes
app.use("/v1/user", userRouter);
app.use("/v1/freelancer", freelancerRouter);
app.use("/v1/client", clientRouter);

// handles all the unused links
app.all("/*", (req, res) => {
  return response.fail(res, "this invalid request")
})


try {
  // certs options
  var options = {
    key: fs.readFileSync(path.join(path.resolve('.'), config.certificate.key)),
    cert: fs.readFileSync(path.join(path.resolve('.'), config.certificate.cert))
  };

  var server = https.createServer(options, app)
}catch{
  console.log('\x1b[31m%s\x1b[0m', "Couldn't find certs. starting without ssl")
  server = app;
}

// starts the app
server.listen(config.port, () => {
  console.log('\x1b[32m%s\x1b[0m', "server starting on port : " + config.port)
})
