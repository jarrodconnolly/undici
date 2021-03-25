'use strict'

const Client = require('./lib/core/client')
const errors = require('./lib/core/errors')
const Pool = require('./lib/pool')
const { Agent, getGlobalAgent, setGlobalAgent } = require('./lib/agent')
const util = require('./lib/core/util')
const { InvalidArgumentError } = require('./lib/core/errors')
const api = require('./lib/api')

Object.assign(Client.prototype, api)
Object.assign(Pool.prototype, api)
Object.assign(Agent.prototype, api)

function undici (url, opts) {
  return new Pool(url, opts)
}

module.exports = undici

module.exports.Pool = Pool
module.exports.Client = Client
module.exports.errors = errors

module.exports.Agent = Agent
module.exports.setGlobalAgent = setGlobalAgent
module.exports.getGlobalAgent = getGlobalAgent

function makeDispatch (fn) {
  return (url, { agent = getGlobalAgent(), method = 'GET', ...opts } = {}, ...additionalArgs) => {
    if (opts.path != null) {
      throw new InvalidArgumentError('unsupported opts.path')
    }

    const { origin, pathname, search } = util.parseURL(url)
    const path = `${pathname || '/'}${search || ''}`

    return fn.call(agent, { ...opts, origin, method, path }, ...additionalArgs)
  }
}

module.exports.request = makeDispatch(api.request)
module.exports.stream = makeDispatch(api.stream)
module.exports.pipeline = makeDispatch(api.pipeline)
module.exports.connect = makeDispatch(api.connect)
module.exports.upgrade = makeDispatch(api.upgrade)
