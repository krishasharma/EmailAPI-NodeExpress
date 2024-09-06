/*
#######################################################################
#
# Copyright (C) 2020-2024 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/

const express = require('express');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');
const uuid = require('uuid');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const apiSpec = path.join(__dirname, '../api/openapi.yaml');
const apidoc = yaml.load(fs.readFileSync(apiSpec, 'utf8'));
app.use('/v0/api-docs', swaggerUi.serve, swaggerUi.setup(apidoc));

app.use(
  OpenApiValidator.middleware({
    apiSpec: apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
);

const mailboxes = {
  inbox: [
    {
      'id': '591b428e-1b99-4a56-b653-dab17210b3b7',
      'to-name': 'CSE186 Student',
      'to-email': 'cse186-student@ucsc.edu',
      'from-name': 'Cherye O\'Loughane',
      'from-email': 'coloughane0@nymag.com',
      'subject': 'Broderskab (Brotherhood)',
      'received': '2020-07-07T00:18:37Z',
      'content': 'Duis aliquam convallis nunc.',
    },
  ],
  sent: [],
  trash: [],
};

const findEmailById = (id) => {
  for (const mailbox in mailboxes) {
    if (mailboxes.hasOwnProperty(mailbox)) {
      const email = mailboxes[mailbox].find((e) => e.id === id);
      if (email) {
        return email;
      }
    }
  }
  return null;
};

// GET /v0/mail
app.get('/v0/mail', (req, res) => {
  const {mailbox} = req.query;
  if (mailbox) {
    if (!mailboxes[mailbox]) {
      return res.status(404).send('Mailbox not found');
    }
    const result = {
      name: mailbox,
      mail: mailboxes[mailbox].map((email) => {
        const {content, ...rest} = email;
        if (process.env.NODE_ENV === 'development') {
          console.log(content); // Use content in development mode
        }
        return rest;
      }),
    };
    return res.status(200).json([result]);
  }
  const result = Object.keys(mailboxes).map((mailbox) => ({
    name: mailbox,
    mail: mailboxes[mailbox].map((email) => {
      const {content, ...rest} = email;
      if (process.env.NODE_ENV === 'development') {
        console.log(content); // Use content in development mode
      }
      return rest;
    }),
  }));
  res.status(200).json(result);
});

// GET /v0/mail/:id
app.get('/v0/mail/:id', (req, res) => {
  const {id} = req.params;
  const email = findEmailById(id);
  if (email) {
    return res.status(200).json(email);
  } else {
    return res.status(404).send('Email not found');
  }
});

// POST /v0/mail
app.post('/v0/mail', (req, res) => {
  const {'to-name': toName, 'to-email': toEmail, subject, content} = req.body;
  if (
    !toName ||
    !toEmail ||
    !subject ||
    !content ||
    Object.keys(req.body).length > 4
  ) {
    return res.status(400).send('Invalid email');
  }
  const newEmail = {
    'id': uuid.v4(),
    'to-name': toName,
    'to-email': toEmail,
    'from-name': 'Default Sender',
    'from-email': 'default.sender@example.com',
    subject,
    'received': new Date().toISOString(),
    content,
  };
  mailboxes.sent.push(newEmail);
  res.status(201).json(newEmail);
});

// PUT /v0/mail/:id
app.put('/v0/mail/:id', (req, res) => {
  const {id} = req.params;
  const {mailbox} = req.query;
  if (!mailbox) {
    return res.status(400).send('Mailbox not specified');
  }
  const email = findEmailById(id);
  if (!email) {
    return res.status(404).send('Email not found');
  }
  for (const mb in mailboxes) {
    if (mailboxes.hasOwnProperty(mb)) {
      const emailIndex = mailboxes[mb].findIndex((e) => e.id === id);
      if (emailIndex !== -1) {
        const [email] = mailboxes[mb].splice(emailIndex, 1);
        if (mailbox === 'sent' && mb !== 'sent') {
          return res.status(409).send('Cannot move to the sent mailbox');
        }
        if (!mailboxes[mailbox]) {
          mailboxes[mailbox] = [];
        }
        mailboxes[mailbox].push(email);
        return res.status(204).send();
      }
    }
  }
  return res.status(404).send('Email not found');
});

app.use((err, req, res, next) => {
  if (err.status === 404 || err.status === 400) {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors,
      status: err.status,
    });
  }
  res.status(500).json({
    message: err.message,
    errors: err.errors,
    status: err.status,
  });
});

module.exports = app;
