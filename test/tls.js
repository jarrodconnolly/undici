'use strict'

const { test } = require('tap')
const { Client } = require('..')
const { kSocket } = require('../lib/core/symbols')
const { Readable } = require('stream')
const { kRunning } = require('../lib/core/symbols')

test('tls get 1', (t) => {
  t.plan(4)

  const client = new Client('https://www.github.com')
  t.teardown(client.close.bind(client))

  client.request({ method: 'GET', path: '/' }, (err, data) => {
    t.error(err)
    t.equal(data.statusCode, 301)
    t.equal(client[kSocket].authorized, true)

    data.body
      .resume()
      .on('end', () => {
        t.pass()
      })
  })
})

test('tls get 2', (t) => {
  t.plan(4)

  const client = new Client('https://140.82.112.4', {
    tls: {
      servername: 'www.github.com'
    }
  })
  t.teardown(client.close.bind(client))

  client.request({ method: 'GET', path: '/' }, (err, data) => {
    t.error(err)
    t.equal(data.statusCode, 301)
    t.equal(client[kSocket].authorized, true)

    data.body
      .resume()
      .on('end', () => {
        t.pass()
      })
  })
})

test('tls get 3', (t) => {
  t.plan(9)

  const client = new Client('https://140.82.112.4')
  t.teardown(client.destroy.bind(client))

  let didDisconnect = false
  client.request({
    method: 'GET',
    path: '/',
    headers: {
      host: 'www.github.com'
    }
  }, (err, data) => {
    t.error(err)
    t.equal(data.statusCode, 301)
    t.equal(client[kSocket].authorized, true)

    data.body
      .resume()
      .on('end', () => {
        t.pass()
      })
    client.once('disconnect', () => {
      t.pass()
      didDisconnect = true
    })
  })

  const body = new Readable({ read () {} })
  body.on('error', (err) => {
    t.ok(err)
  })
  client.request({
    method: 'POST',
    path: '/',
    body,
    headers: {
      host: 'www.asd.com'
    }
  }, (err, data) => {
    t.equal(didDisconnect, true)
    t.equal(client[kSocket].authorized, false)
    t.ok(err)
  })
})

test('tls get 4', (t) => {
  t.plan(9)

  const client = new Client('https://140.82.112.4', {
    tls: {
      servername: 'www.github.com'
    },
    pipelining: 2
  })
  t.teardown(client.close.bind(client))

  client.request({
    method: 'GET',
    path: '/',
    headers: {
      host: '140.82.112.4'
    }
  }, (err, data) => {
    t.error(err)
    t.equal(client[kRunning], 1)
    t.equal(data.statusCode, 301)
    t.equal(client[kSocket].authorized, true)

    client.request({
      method: 'GET',
      path: '/',
      headers: {
        host: 'www.github.com'
      }
    }, (err, data) => {
      t.error(err)
      t.equal(data.statusCode, 301)
      t.equal(client[kSocket].authorized, true)

      data.body
        .resume()
        .on('end', () => {
          t.pass()
        })
    })

    data.body
      .resume()
      .on('end', () => {
        t.pass()
      })
  })
})

test('tls get 5', (t) => {
  t.plan(8)

  const client = new Client('https://140.82.112.4')
  t.teardown(client.destroy.bind(client))

  let didDisconnect = false
  client.request({
    method: 'GET',
    path: '/',
    headers: {
      host: 'www.github.com'
    }
  }, (err, data) => {
    t.error(err)
    t.equal(data.statusCode, 301)
    t.equal(client[kSocket].authorized, true)

    data.body
      .resume()
      .on('end', () => {
        t.pass()
      })
    client.once('disconnect', () => {
      t.pass()
      didDisconnect = true
    })
  })

  client.request({
    method: 'POST',
    path: '/',
    body: [],
    headers: {
      host: 'www.asd.com'
    }
  }, (err, data) => {
    t.equal(didDisconnect, true)
    t.equal(client[kSocket].authorized, false)
    t.ok(err)
  })
})
