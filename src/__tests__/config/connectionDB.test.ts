// src/__tests__/config/connectionDB.test.ts

describe('connectDB', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;
  let mockConnect: jest.Mock<any, any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    
    // Create mock function
    mockConnect = jest.fn();
    
    // Clear all env vars
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_INITDB_ROOT_USERNAME;
    delete process.env.MONGO_INITDB_ROOT_PASSWORD;
    delete process.env.MONGO_HOST;
    delete process.env.MONGO_PORT;
    delete process.env.MONGO_INITDB_DATABASE;
    delete process.env.DB_NAME;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('calls mongoose.connect with MONGODB_URI when provided', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({ dbName: 'qualifica-professor' })
      );
    });
  });

  it('should build URI with credentials when user and pass are provided', async () => {
    process.env.MONGO_INITDB_ROOT_USERNAME = 'testuser';
    process.env.MONGO_INITDB_ROOT_PASSWORD = 'testpass';
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    process.env.MONGO_INITDB_DATABASE = 'testdb';
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({ dbName: 'testdb' })
      );
    });
  });

  it('should build URI without credentials when user and pass are not provided', async () => {
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    process.env.DB_NAME = 'testdb';
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({ dbName: 'testdb' })
      );
    });
  });

  it('should use default values when env vars are not set', async () => {
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/qualifica-professor',
        expect.objectContaining({ dbName: 'qualifica-professor' })
      );
    });
  });

  it('should handle invalid URI scheme error', async () => {
    process.env.MONGODB_URI = 'invalid://localhost:27017/testdb';

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error connecting to MongoDB:', 
        expect.objectContaining({
          message: expect.stringContaining('Invalid MongoDB URI scheme')
        })
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  it('should handle mongoose connection error', async () => {
    const connectionError = new Error('Connection failed');
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    mockConnect.mockRejectedValue(connectionError);

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error connecting to MongoDB:', connectionError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  it('should mask password in URI when logging', async () => {
    process.env.MONGO_INITDB_ROOT_USERNAME = 'testuser';
    process.env.MONGO_INITDB_ROOT_PASSWORD = 'secretpass';
    process.env.MONGO_HOST = 'localhost';
    process.env.MONGO_PORT = '27017';
    process.env.MONGO_INITDB_DATABASE = 'testdb';
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Connecting to MongoDB with URI:', 
        'mongodb://localhost:27017/testdb'
      );
    });
  });

  it('should handle mongodb+srv:// scheme', async () => {
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/mydb';
    mockConnect.mockResolvedValue({});

    await jest.isolateModules(async () => {
      jest.doMock('mongoose', () => ({ connect: mockConnect }));
      const { connectDB } = await import('../../config/connectionDB');
      await connectDB();

      expect(mockConnect).toHaveBeenCalledWith(
        'mongodb+srv://user:pass@cluster.mongodb.net/mydb',
        expect.any(Object)
      );
    });
  });

});
