// src/__tests__/server.test.ts

describe('entry: src/server.ts', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('calls connectDB and starts server with PORT from env', async () => {
    const mockConnectDB = jest.fn().mockResolvedValue(undefined);
    const mockListen = jest.fn((port: number, host: string | (() => void), cb?: () => void) => {
      if (typeof host === 'function') {
        host();
      } else if (cb) {
        cb();
      }
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    jest.doMock('../app', () => ({ __esModule: true, default: { listen: mockListen } }));
    jest.doMock('../config/connectionDB', () => ({ connectDB: mockConnectDB }));

    process.env.PORT = '4321';
    const { startServer } = await import('../server');
    await startServer();

    expect(mockConnectDB).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(4321, '0.0.0.0', expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('API up on 0.0.0.0:4321');

    consoleSpy.mockRestore();
  });

  it('defaults to 3000 when PORT not set', async () => {
    const mockConnectDB = jest.fn().mockResolvedValue(undefined);
    const mockListen = jest.fn((port: number, host: string | (() => void), cb?: () => void) => {
      if (typeof host === 'function') {
        host();
      } else if (cb) {
        cb();
      }
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    jest.doMock('../app', () => ({ __esModule: true, default: { listen: mockListen } }));
    jest.doMock('../config/connectionDB', () => ({ connectDB: mockConnectDB }));

    delete process.env.PORT;
    const { startServer } = await import('../server');
    await startServer();

    expect(mockListen).toHaveBeenCalledWith(3000, '0.0.0.0', expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('API up on 0.0.0.0:3000');

    consoleSpy.mockRestore();
  });

  it('uses port parameter when provided', async () => {
    const mockConnectDB = jest.fn().mockResolvedValue(undefined);
    const mockListen = jest.fn((port: number, host: string | (() => void), cb?: () => void) => {
      if (typeof host === 'function') {
        host();
      } else if (cb) {
        cb();
      }
    });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    jest.resetModules();
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    jest.doMock('../app', () => ({ __esModule: true, default: { listen: mockListen } }));
    jest.doMock('../config/connectionDB', () => ({ connectDB: mockConnectDB }));

    const { startServer } = await import('../server');
    await startServer(8080);

    expect(mockConnectDB).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalledWith(8080, '0.0.0.0', expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('API up on 0.0.0.0:8080');

    consoleSpy.mockRestore();
  });
});
