/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */

// init project
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const fs = require('fs');
const low = require('lowdb');
const jwt = require('jsonwebtoken');
const { csrfCheck, sessionCheck } = require('./libs/common');
const app = express();

app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.set('views', './views');
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('dist'));
app.use(session({
  secret: 'secret', // You should specify a real secret here
  resave: true,
  saveUninitialized: false,
  proxy: true,
  cookie:{
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  }
}));

app.use((req, res, next) => {
  if (process.env.PROJECT_DOMAIN) {
    process.env.HOSTNAME = `${process.env.PROJECT_DOMAIN}.glitch.me`;
  } else {
    process.env.HOSTNAME = req.headers.host;
  }
  const protocol = /^localhost/.test(process.env.HOSTNAME) ? 'http' : 'https';
  process.env.ORIGIN = `${protocol}://${process.env.HOSTNAME}`;
  if (
    req.get('x-forwarded-proto') &&
    req.get('x-forwarded-proto').split(',')[0] !== 'https'
  ) {
    return res.redirect(301, process.env.ORIGIN);
  }
  req.schema = 'https';
  next();
});

app.post('/verify', csrfCheck, (req, res) => {
  const { idToken } = req.body;
  console.log(idToken);

  try {
    const token = jwt.verify(idToken, 'xxxxx');
    console.log(token);
    // TODO: Verify nonce
    req.session.user_id = token.user_id;
    req.session.username = token.username;
    req.session.name = token.name;
    req.session.picture = token.picture;
    res.status(200).json({})  ;
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'ID token verification failed.'});
  }
});

app.get('/signout', (req, res) => {
  req.session.destroy();
  req.redirect(307, '/');
});

app.get('/home', sessionCheck, (req, res) => {
  res.render('home.html', {
    user_id: req.session.user_id,
    username: req.session.username,
    name: req.session.name,
    picture: req.session.picture
  })
});

app.get('/', (req, res) => {
  res.render('index.html');
});

const port = process.env.GLITCH_DEBUGGER ? null : 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
