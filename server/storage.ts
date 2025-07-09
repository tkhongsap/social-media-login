import { users, lineSessions, googleSessions, type User, type InsertUser, type LineSession, type InsertLineSession, type GoogleSession, type InsertGoogleSession } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Line session methods
  createLineSession(session: InsertLineSession): Promise<LineSession>;
  getLineSession(sessionId: string): Promise<LineSession | undefined>;
  deleteLineSession(sessionId: string): Promise<void>;
  getLineSessionByUserId(userId: string): Promise<LineSession | undefined>;
  
  // Google session methods
  createGoogleSession(session: InsertGoogleSession): Promise<GoogleSession>;
  getGoogleSession(sessionId: string): Promise<GoogleSession | undefined>;
  deleteGoogleSession(sessionId: string): Promise<void>;
  getGoogleSessionByUserId(userId: string): Promise<GoogleSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private lineSessions: Map<string, LineSession>;
  private googleSessions: Map<string, GoogleSession>;
  currentUserId: number;
  currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.lineSessions = new Map();
    this.googleSessions = new Map();
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

  async createLineSession(insertSession: InsertLineSession): Promise<LineSession> {
    const id = this.currentSessionId++;
    const session: LineSession = { 
      ...insertSession, 
      id,
      createdAt: new Date(),
      statusMessage: insertSession.statusMessage || null,
      pictureUrl: insertSession.pictureUrl || null,
    };
    this.lineSessions.set(session.sessionId, session);
    return session;
  }

  async getLineSession(sessionId: string): Promise<LineSession | undefined> {
    const session = this.lineSessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.lineSessions.delete(sessionId);
    }
    return undefined;
  }

  async deleteLineSession(sessionId: string): Promise<void> {
    this.lineSessions.delete(sessionId);
  }

  async getLineSessionByUserId(userId: string): Promise<LineSession | undefined> {
    return Array.from(this.lineSessions.values()).find(
      (session) => session.userId === userId && session.expiresAt > new Date(),
    );
  }

  async createGoogleSession(insertSession: InsertGoogleSession): Promise<GoogleSession> {
    const id = this.currentSessionId++;
    const session: GoogleSession = { 
      ...insertSession, 
      id,
      createdAt: new Date(),
      pictureUrl: insertSession.pictureUrl || null,
      refreshToken: insertSession.refreshToken || null,
    };
    this.googleSessions.set(session.sessionId, session);
    return session;
  }

  async getGoogleSession(sessionId: string): Promise<GoogleSession | undefined> {
    const session = this.googleSessions.get(sessionId);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.googleSessions.delete(sessionId);
    }
    return undefined;
  }

  async deleteGoogleSession(sessionId: string): Promise<void> {
    this.googleSessions.delete(sessionId);
  }

  async getGoogleSessionByUserId(userId: string): Promise<GoogleSession | undefined> {
    return Array.from(this.googleSessions.values()).find(
      (session) => session.userId === userId && session.expiresAt > new Date(),
    );
  }
}

export const storage = new MemStorage();
