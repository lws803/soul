import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import createAppFixture from './create-app-fixture';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createAppFixture({});
    await app.init();
  });

  afterAll((done) => {
    Promise.all([app.close()]).then(() => done());
  });

  it('/healthcheck (GET)', () => {
    return request(app.getHttpServer())
      .get('/healthcheck')
      .expect(200)
      .expect({ status: 'OK' });
  });
});
