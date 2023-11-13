/*
 * Copyright 2023 European netID Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Portions of this code are derived from the FedCM Demo
 * https://fedcm-rp-demo.glitch.me/, licensed under the Apache License,
 * Version 2.0 by 2019 Google Inc. Copyright 2019
 */

// init project
const express = require('express')
const session = require('express-session')
const hbs = require('hbs')
const jwt = require('jsonwebtoken')
const { csrfCheck, sessionCheck, getUser } = require('./libs/common')
const app = express()

// IDP Config, replace with your own
const fs = require('fs')
const idpConfig = JSON.parse(fs.readFileSync('./config/idpConfig.json'))

// register the helper function
hbs.registerHelper('eq', function (a, b) {
  return a === b
})

hbs.registerHelper('getOrigin', function (url) {
  const origin = new URL(url).origin
  return origin
})

hbs.registerHelper('or', function (a, b) {
  return a || b
})

app.set('view engine', 'html')
app.engine('html', hbs.__express)
app.set('views', './views')
app.use(express.json())
app.use(express.static('public'))
app.use(express.static('dist'))
app.use(
  session({
    secret: 'secret', // You should specify a real secret here
    resave: true,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: false
    }
  })
)

app.use((req, res, next) => {
  if (process.env.PROJECT_DOMAIN) {
    process.env.HOSTNAME = `${process.env.PROJECT_DOMAIN}.glitch.me`
  } else {
    process.env.HOSTNAME = req.headers.host
  }
  const protocol = /^localhost/.test(process.env.HOSTNAME) ? 'http' : 'https'
  process.env.ORIGIN = `${protocol}://${process.env.HOSTNAME}`
  if (
    req.get('x-forwarded-proto') &&
    req.get('x-forwarded-proto').split(',')[0] !== 'https'
  ) {
    return res.redirect(301, process.env.ORIGIN)
  }
  req.schema = 'https'

  // Initialize config if it doesn't exist
  if (!req.session.config) {
    req.session.config = {
      mode: 'onclick',
      mediation: 'optional',
      idpConfig: idpConfig
    }
  }

  next()
})

app.post('/verify', csrfCheck, (req, res) => {
  try {
    const nonce = req.session.nonce.toString()

    // TODO: Check if there's any other criteria is missing
    console.log(req.body.token)
    const token = jwt.verify(req.body.token, 'xxxxxxx')

    // Check if this is a bearer token (scope feature was used)
    if (!token.token_type) {
      // In case of a "standard" login we expect an ID Token here directly
      const user = getUser(token.sub, token.email, token.name, token.picture)

      req.session.user_id = user.user_id
      req.session.username = user.username
      req.session.name = user.name
      req.session.picture = user.picture
      res.status(200).json({ success: 'ID token valid' })
    } else if (token.token_type && token.token_type === 'Bearer') {
      // In case of a "scope" login we expect an access and/or ID token here
      if (token.id_token) {
        const id_token = jwt.verify(token.id_token, 'xxxxxxx')
        const user = getUser(
          id_token.sub,
          id_token.email,
          id_token.name,
          id_token.picture
        )
        // set user attributes in session
        req.session.user_id = user.user_id
        req.session.username = user.username
        req.session.name = user.name
        req.session.picture = user.picture
      }

      // set access token in session
      if (token.access_token) {
        req.session.access_token = jwt.verify(token.access_token, 'xxxxxxx')
      }
      res.status(200).json({ success: 'token valid' })
    } else {
      res.status(401).json({ error: 'token verification failed.' })
    }
  } catch (e) {
    console.error(e.message)
    res.status(401).json({ error: 'token verification failed.' })
  }
})

app.get('/signout', (req, res) => {
  // Save settings in temporary variable
  const settings = req.session.config

  // Regenerate the session
  req.session.regenerate(err => {
    if (err) {
      console.error(err)
      res.status(500).send('Failed to regenerate session')
    } else {
      // Copy settings to the new session
      req.session.config = settings

      // Redirect to the home page
      res.redirect(307, '/')
    }
  })
})

app.get('/home', sessionCheck, (req, res) => {
  const user = res.locals.user || {}
  const config = req.session.config || {}
  res.render('home.html', {
    user_id: user.user_id || undefined,
    username: user.username || undefined,
    name: user.name || undefined,
    picture: user.picture || undefined,
    access_token: res.locals.access_token,
    config
  })
})

app.get('/', (req, res) => {
  const nonce = Math.floor(Math.random() * 10e10)
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce
  const ot_token = process.env.OT_TOKEN
  // get session config
  const config = req.session.config || {}

  if (req.session.user_id || req.session.access_token) {
    // Redirect to '/home' if 'req.session.user' or req.session.access_token exists
    res.redirect('/home')
  } else {
    // Render the default index.html if 'req.session.user' doesn't exist
    res.render('index.html', {
      nonce,
      ot_token,
      config
    })
  }
})

app.post('/config-save', (req, res) => {
  const { scopeInput, contextInput, modeInput, userInfoInput, mediationInput } =
    req.body

  // Set config
  const config =
    scopeInput.length > 0 ||
    contextInput.length > 0 ||
    modeInput ||
    mediationInput
      ? {
          scope: scopeInput,
          context: contextInput,
          mode: modeInput,
          userInfoEnabled: userInfoInput,
          mediation: mediationInput,
          //always set the current idpConfig
          idpConfig: idpConfig
        }
      : undefined

  // Save the config in the server-side session
  req.session.config = config

  res.sendStatus(200) // Send a success response
})

app.get('/config', (req, res) => {
  // Send the config data
  return res.json(req.session.config)
})

const port = process.env.GLITCH_DEBUGGER ? null : 7080
const listener = app.listen(port || process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
