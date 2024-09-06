/* Your tets for the Stretch Requirement go in here */
/*
test('Remove this test', async () => {
});
*/
const supertest = require('supertest');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

const mailboxesFilePath = path.join(__dirname, '../data/mailboxes.json');

test('Save mailbox modifications to disk and load after restart', async () => {
  const newEmail = {
    'to-name': 'Persistent User',
    'to-email': 'persistent.user@example.com',
    'subject': 'Persistent Subject',
    'content': 'Persistent Content',
  };

  // Clear the mailboxes file before the test
  if (fs.existsSync(mailboxesFilePath)) {
    fs.unlinkSync(mailboxesFilePath);
  }

  // Post a new email
  const postResponse = await request.post('/v0/mail')
    .send(newEmail)
    .expect(201);

  const emailId = postResponse.body.id;

  // Move the email to 'trash'
  await request.put(`/v0/mail/${emailId}?mailbox=trash`)
    .expect(204);

  // Check that the email is in 'trash'
  let getResponse = await request.get('/v0/mail?mailbox=trash')
    .expect(200);

  let trashEmails = getResponse.body[0].mail;
  let movedEmail = trashEmails.find((mail) => mail.id === emailId);

  expect(movedEmail).toBeDefined();

  // Simulate server restart by reloading the app
  server.close();
  server = http.createServer(app);
  server.listen();
  request = supertest(server);

  // Check that the email is still in 'trash' after restart
  getResponse = await request.get('/v0/mail?mailbox=trash')
    .expect(200);

  trashEmails = getResponse.body[0].mail;
  movedEmail = trashEmails.find((mail) => mail.id === emailId);

  expect(movedEmail).toBeDefined();
});

/*
test('Save mailbox modifications to
disk handles errors gracefully', async () => {
  const newEmail = {
    'to-name': 'Test User',
    'to-email': 'test.user@example.com',
    'subject': 'Test Subject',
    'content': 'Test Content',
  };

  const mailboxesFilePath = path.join(__dirname, '../data/sent.json');
  // Change the file permissions to simulate an error
  fs.chmodSync(mailboxesFilePath, 0o000);

  await request.post('/v0/mail')
    .send(newEmail)
    .expect(500);

  // Restore file permissions
  fs.chmodSync(mailboxesFilePath, 0o644);
});
*/
