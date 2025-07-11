import { users, authSessions, type User, type InsertUser, type AuthSession, type InsertAuthSession } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Unified auth session methods
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSession(sessionId: string): Promise<AuthSession | undefined>;
  deleteAuthSession(sessionId: string): Promise<void>;
  getAuthSessionByProviderUserId(provider: string, userId: string): Promise<AuthSession | undefined>;
  getAllAuthSessions(): Promise<AuthSession[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private authSessions: Map<string, AuthSession>;
  currentUserId: number;
  currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.authSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAuthSession(insertSession: InsertAuthSession): Promise<AuthSession> {
    const id = this.currentSessionId++;
    const session: AuthSession = { 
      ...insertSession, 
      id,
      createdAt: new Date(),
      metadata: insertSession.metadata || null,
      refreshToken: insertSession.refreshToken || null,
      email: insertSession.email || null,
      pictureUrl: insertSession.pictureUrl || null,
    };
    this.authSessions.set(session.sessionId, session);
    return session;
  }

  async getAuthSession(sessionId: string): Promise<AuthSession | undefined> {
    const session = this.authSessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.authSessions.delete(sessionId);
    }
    return undefined;
  }

  async deleteAuthSession(sessionId: string): Promise<void> {
    this.authSessions.delete(sessionId);
  }

  async getAuthSessionByProviderUserId(provider: string, userId: string): Promise<AuthSession | undefined> {
    return Array.from(this.authSessions.values()).find(
      (session) => session.provider === provider && session.userId === userId && session.expiresAt > new Date(),
    );
  }

  async getAllAuthSessions(): Promise<AuthSession[]> {
    return Array.from(this.authSessions.values()).filter(
      (session) => session.expiresAt > new Date()
    );
  }
}

export const storage = new MemStorage();
