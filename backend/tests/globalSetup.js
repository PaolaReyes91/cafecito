import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const setup = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.__MONGO_URI__ = uri;
};

export const teardown = async () => {
  if (mongoServer) await mongoServer.stop();
};

export default setup;
