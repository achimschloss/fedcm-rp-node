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
const jwt = require('jsonwebtoken');
const { csrfCheck, sessionCheck, getUser } = require('./libs/common');
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
    secure: true
  }
}));

const CLIENT_ID = 'https://furtive-candy-cauliflower.glitch.me/';

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
  try {
    const nonce = req.session.nonce.toString();

    // TODO: Check if there's any other criteria is missing
    console.log(req.body.token);
    const token = jwt.verify(req.body.token, "xxxxxxx");
    
    const user = getUser(token.sub, token.email, token.name, token.picture);

    req.session.user_id = user.user_id;
    req.session.username = user.username;
    req.session.name = user.name;
    req.session.picture = user.picture;
    res.status(200).json({ success: 'ID token valid'});
    
  } catch (e) {
    console.error(e.message);
    res.status(401).json({ error: 'ID token verification failed.'});
  }
});

app.get('/signout', (req, res) => {
  req.session.destroy();
  res.redirect(307, '/');
});

app.get('/home', sessionCheck, (req, res) => {
  const user = res.locals.user;
  const config = req.session.config || {};
  res.render('home.html', {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    picture: user.picture,
    config
  });
});

app.get('/', (req, res) => {
  const nonce = Math.floor(Math.random()*10e10);
  // TODO: Shouldn't I timeout this?
  req.session.nonce = nonce;
  const ot_token = process.env.OT_TOKEN;
  // get session config
  const config = req.session.config || {};

  if (req.session.user_id) {
    // Redirect to '/home' if 'req.session.user' exists
    res.redirect('/home');
  } else {
    // Render the default index.html if 'req.session.user' doesn't exist
    res.render('index.html', { nonce, ot_token, config });
  }
});

app.post("/config-save", (req, res) => {
  const { scopeInput, contextInput } = req.body;

  // Set config
  const config =
    scopeInput.length > 0 || contextInput.length > 0
      ? { scope: scopeInput, context: contextInput }
      : undefined;

  // Save the config in the server-side session
  req.session.config = config;

  res.sendStatus(200); // Send a success response
});



const port = process.env.GLITCH_DEBUGGER ? null : 8080;
const listener = app.listen(port || process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
