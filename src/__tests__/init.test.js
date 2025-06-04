import { jest } from '@jest/globals';

const mockExecute = jest.fn();
const mockEnd = jest.fn();
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
});

jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}));

const { initDatabase } = await import('../db/init.js');

describe('initDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create all tables and close connection', async () => {
    await initDatabase();

    // Überprüfen, ob die Verbindung hergestellt wurde
    expect(mockGetConnection).toHaveBeenCalled();

    // Überprüfen, ob execute mehrfach aufgerufen wurde (für 6 Tabellen)
    expect(mockExecute).toHaveBeenCalledTimes(6);

    // Überprüfen, ob die Verbindung geschlossen wurde
    expect(mockEnd).toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    // Simuliere, dass getConnection einen Fehler wirft
    mockGetConnection.mockRejectedValueOnce(new Error('Connection failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await initDatabase();

    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ Fehler bei der DB-Initialisierung:',
      'Connection failed'
    );

    consoleSpy.mockRestore();
  });
});
