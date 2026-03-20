import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, setLogLevel } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Firestore Emulator Security Rules', () => {
  beforeAll(async () => {
    // Silence expected Firebase warnings during tests
    setLogLevel('error');
    
    // Initialize the test environment targeting the local emulator
    testEnv = await initializeTestEnvironment({
      projectId: 'fittrack-test',
      firestore: {
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  beforeEach(async () => {
    // Clear the database before every single test so we start fresh!
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    // Clean up the environment after tests finish
    await testEnv.cleanup();
  });

  it('should allow a logged-in user to write to their own profile', async () => {
    // Create a fake authenticated user context (User ID: "alice123")
    const aliceDb = testEnv.authenticatedContext('alice123').firestore();
    
    const userRef = doc(aliceDb, 'users', 'alice123');
    await expect(setDoc(userRef, { username: 'Alice', age: 25 })).resolves.toBeUndefined();
  });

  it('should deny a user from modifying a different user profile', async () => {
    // Create fake users Alice and Bob
    const aliceDb = testEnv.authenticatedContext('alice123').firestore();
    
    // Alice maliciously tries to overwrite Bob's profile document
    const bobRef = doc(aliceDb, 'users', 'bob456');
    await expect(setDoc(bobRef, { username: 'Hacked!' })).rejects.toThrow();
  });
});