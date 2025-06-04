/**
 * @file __tests__/init.test.js
 * @description Unit tests for the database initialization function `initDatabase`.
 */

import { jest } from '@jest/globals'

// Mock database connection
const mockExecute = jest.fn()
const mockEnd = jest.fn()
const mockGetConnection = jest.fn().mockResolvedValue({
  execute: mockExecute,
  end: mockEnd
})

// Mock the DB module
jest.unstable_mockModule('../db/db.js', () => ({
  getConnection: mockGetConnection
}))

// Import initDatabase after mocking
const { initDatabase } = await import('../db/init.js')

/**
 * Test suite for initDatabase()
 */
describe('initDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Test that tables are created and connection is closed
   */
  test('should create all tables and close connection', async () => {
    await initDatabase()

    // Should get DB connection
    expect(mockGetConnection).toHaveBeenCalled()

    // Should execute 6 SQL commands
    expect(mockExecute).toHaveBeenCalledTimes(6)

    // Should close connection
    expect(mockEnd).toHaveBeenCalled()
  })

  /**
   * Test error handling during initialization
   */
  test('should handle errors gracefully', async () => {
    mockGetConnection.mockRejectedValueOnce(new Error('Connection failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await initDatabase()

    expect(consoleSpy).toHaveBeenCalledWith(
      '❌ Fehler bei der DB-Initialisierung:',
      'Connection failed'
    )

    consoleSpy.mockRestore()
  })
})
