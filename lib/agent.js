'use strict'
const { InvalidArgumentError } = require('./core/errors')
const Pool = require('./client-pool')
const Client = require('./core/client')
const EventEmitter = require('events')

const kOnConnect = Symbol('onConnect')
const kOnDisconnect = Symbol('onDisconnect')
const kOnDrain = Symbol('onDrain')
const kClients = Symbol('cache')
const kFactory = Symbol('factory')

function defaultFactory (origin, opts) {
  return opts && opts.connections === 1
    ? new Client(origin, opts)
    : new Pool(origin, opts)
}

class Agent extends EventEmitter {
  constructor ({ factory = defaultFactory, ...opts } = {}) {
    super()

    if (typeof factory !== 'function') {
      throw new InvalidArgumentError('factory must be a function.')
    }

    this[kFactory] = (origin) => factory(origin, opts)
    this[kClients] = new Map()

    const agent = this

    this[kOnConnect] = function onConnect (origin, clients) {
      agent.emit('connect', origin, [...clients, agent])
    }

    this[kOnDrain] = function onDrain (origin) {
      agent.emit('drain', origin)
    }

    this[kOnDisconnect] = function onDestroy (origin, clients, err) {
      if (this.connected === 0 && this.size === 0) {
        this.off('disconnect', agent[kOnDisconnect])
        agent[kClients].delete(this.origin)
      }

      agent.emit('disconnect', origin, [...clients, agent], err)
    }
  }

  get connected () {
    let ret = 0
    for (const { connected } of this[kClients].values()) {
      ret += connected
    }
    return ret
  }

  get size () {
    let ret = 0
    for (const { size } of this[kClients].values()) {
      ret += size
    }
    return ret
  }

  get pending () {
    let ret = 0
    for (const { pending } of this[kClients].values()) {
      ret += pending
    }
    return ret
  }

  get running () {
    let ret = 0
    for (const { running } of this[kClients].values()) {
      ret += running
    }
    return ret
  }

  // TODO: get closed ()
  // TODO: get destroyed ()

  dispatch (opts, handler) {
    if (!opts || typeof opts !== 'object') {
      throw new InvalidArgumentError('opts must be an object.')
    }

    if (typeof opts.origin !== 'string' || opts.origin === '') {
      throw new InvalidArgumentError('Origin must be a non-empty string.')
    }

    let pool = this[kClients].get(opts.origin)

    if (!pool) {
      pool = this[kFactory](opts.origin)
        .on('connect', this[kOnConnect])
        .on('disconnect', this[kOnDisconnect])
        .on('drain', this[kOnDrain])

      this[kClients].set(opts.origin, pool)
    }

    return pool.dispatch(opts, handler)
  }

  // TODO: close (callback)
  close () {
    const closePromises = []
    for (const pool of this[kClients].values()) {
      closePromises.push(pool.close())
    }
    return Promise.all(closePromises)
  }

  // TODO: destroy (err, callback)
  destroy () {
    const destroyPromises = []
    for (const pool of this[kClients].values()) {
      destroyPromises.push(pool.destroy())
    }
    return Promise.all(destroyPromises)
  }
}

module.exports = Agent
