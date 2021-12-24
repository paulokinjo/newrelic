const newrelic = require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

let currentMessage = '';

app.set('view engine', 'pug');
app.locals.newrelic = newrelic;

// Pauses for about 1 second
var lookBusy = function() {
  const end = Date.now() + 100;
  while (Date.now() < end) {
    
  }
};

// Throws an error 5% of the time
var maybeError = function() {
  var throwError = Math.floor(Math.random() * 5) === 1;
  if (throwError) {
    throw new Error('This is a synthetic error.');
  }
}

// Middleware for adding custom attributes
// These map to environment variables exposed in the pod spec
var CUSTOM_ATTRIBUTES = {
    'K8S_NODE_NAME': process.env.K8S_NODE_NAME,
    'K8S_HOST_IP': process.env.K8S_HOST_IP,
    'K8S_POD_NAME': process.env.K8S_POD_NAME,
    'K8S_POD_NAMESPACE': process.env.K8S_POD_NAMESPACE,
    'K8S_POD_IP': process.env.K8S_POD_IP,
    'K8S_POD_SERVICE_ACCOUNT': process.env.K8S_POD_SERVICE_ACCOUNT,
    'K8S_POD_TIER': process.env.K8S_POD_TIER,
    'K8S_CLUSTER_NAME': process.env.NEW_RELIC_METADATA_KUBERNETES_CLUSTER_NAME,
};

app.use(function(_, _, next) {
  newrelic.addCustomAttributes(CUSTOM_ATTRIBUTES);
  next();
});

// Look busy middleware
app.use(function(_, _, next) {
  if (process.env.LOOK_BUSY) {
    console.log('looking busy')
    lookBusy();
  }

  next();
});

app.get('/', function (_, res) {
  if (process.env.THROW_ERROR) {
    try {
      maybeError();
    } catch (e) {
      console.error('error: ', e);
      newrelic.noticeError(e, CUSTOM_ATTRIBUTES);
      return res.status(500).send(e.toString());
    }
  }

  res.render('index', { title: 'Guestbook', message: 'Send a string to redis.' });
});

app.get('/message', function (_, res) {
    return res.send(currentMessage);
});

app.get('/healthz', function (_, res) {
  res.status(200).send('OK');    
});

app.post('/', function(req, res) {
  currentMessage = req.body.message;
  res.redirect('/');             
});

app.listen(process.env.PORT || 3000, function () {
  console.error('Example app listening on port 3000!');
});
