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

const supertest = require('supertest');
const http = require('http');

const app = require('../src/app');

let server; let request;

beforeAll(() => {
  server = http.createServer(app);
  server.listen();
  request = supertest(server);
});

afterAll((done) => {
  server.close(done);
});

test('GET Invalid URL', async () => {
  await request.get('/v0/entirely-invalid-path-da-doo-de-dum-dum/')
    .expect(404);
});

describe('Advanced Tests for E-Mail API', () => {
  describe('GET /v0/mail', () => {
    it('should return all emails without content property', async () => {
      const response = await request.get('/v0/mail');
      expect(response.status).toBe(200);
      response.body.forEach((mailbox) => {
        mailbox.mail.forEach((email) => {
          expect(email).not.toHaveProperty('content');
        });
      });
    });
  });

  describe('GET /v0/mail?mailbox={mailbox}', () => {
    it(
      'should return all emails in the specified mailbox without content ' +
      'property',
      async () => {
        const response = await request.get('/v0/mail?mailbox=inbox');
        expect(response.status).toBe(200);
        response.body[0].mail.forEach((email) => {
          expect(email).not.toHaveProperty('content');
        });
      },
    );

    it('should return a 404 error if the mailbox is unknown', async () => {
      const response = await request.get('/v0/mail?mailbox=unknown');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /v0/mail/{id}', () => {
    it(
      'should return the email identified by id with content property',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request.get(`/v0/mail/${emailId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('content');
      },
    );

    it(
      'should return a 404 error if the id does not identify a known email',
      async () => {
        const response = await request.get(
          '/v0/mail/00000000-0000-0000-0000-000000000000',
        );
        expect(response.status).toBe(404);
      },
    );
  });

  describe('POST /v0/mail', () => {
    it(
      'should save a new email in the sent mailbox and return the newly ' +
      'created email',
      async () => {
        const newEmail = {
          'to-name': 'Test User',
          'to-email': 'test.user@example.com',
          'subject': 'Test Subject',
          'content': 'Test Content',
        };
        const response = await request
          .post('/v0/mail')
          .send(newEmail);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('received');
        expect(response.body).toHaveProperty('from-name');
        expect(response.body).toHaveProperty('from-email');
      },
    );

    it(
      'should return a 400 error if the email has any unexpected properties',
      async () => {
        const invalidEmail = {
          'to-name': 'Test User',
          'to-email': 'test.user@example.com',
          'subject': 'Test Subject',
          'content': 'Test Content',
          'unexpected': 'Unexpected Property',
        };
        const response = await request
          .post('/v0/mail')
          .send(invalidEmail);
        expect(response.status).toBe(400);
      },
    );

    it(
      'should return a 400 error if the mailbox is not specified',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}`);
        expect(response.status).toBe(400);
      },
    );
  });

  describe('PUT /v0/mail/{id}?mailbox={mailbox}', () => {
    it(
      'should move the email identified by id into the named mailbox',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}?mailbox=archive`);
        expect(response.status).toBe(204);
      },
    );

    it(
      'should create the mailbox if does not exist and move the email into it',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}?mailbox=newMailbox`);
        expect(response.status).toBe(204);
      },
    );

    it(
      'should return a 404 error if the id does not identify a known email',
      async () => {
        const response = await request
          .put('/v0/mail/00000000-0000-0000-0000-000000000000?mailbox=inbox');
        expect(response.status).toBe(404);
      },
    );

    it(
      'should return a 409 error if the named mailbox is sent ' +
      'and the email is not already in the sent mailbox',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}?mailbox=sent`);
        expect(response.status).toBe(409);
      },
    );

    it(
      'should return a 400 error if the mailbox is not specified',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}`);
        expect(response.status).toBe(400);
      },
    );

    it(
      'should return a 404 error if the email is not found in any mailbox',
      async () => {
        const response = await request
          .put('/v0/mail/00000000-0000-0000-0000-000000000000?mailbox=inbox');
        expect(response.status).toBe(404);
      },
    );
  });

  describe('Error handling', () => {
    it('should return a 404 error for unknown email ID', async () => {
      const response = await request.get(
        '/v0/mail/00000000-0000-0000-0000-000000000000',
      );
      expect(response.status).toBe(404);
    });

    it('should return a 404 error for unknown mailbox in PUT', async () => {
      const response = await request
        .put('/v0/mail/00000000-0000-0000-0000-000000000000?mailbox=unknown');
      expect(response.status).toBe(404);
    });

    it('should return a 404 error for unknown mailbox in GET', async () => {
      const response = await request.get('/v0/mail?mailbox=unknown');
      expect(response.status).toBe(404);
    });

    it(
      'should return a 400 error if the mailbox is not specified',
      async () => {
        // Use a valid email id
        const emailId = '591b428e-1b99-4a56-b653-dab17210b3b7';
        const response = await request
          .put(`/v0/mail/${emailId}`);
        expect(response.status).toBe(400);
      },
    );

    it(
      'should return a 404 error if the email is not found',
      async () => {
        const response = await request
          .get('/v0/mail/00000000-0000-0000-0000-000000000000');
        expect(response.status).toBe(404);
      },
    );
  });
});
