import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Unified authentication sessions table for all providers
export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // 'line', 'google', 'facebook', etc.
  userId: text("user_id").notNull(), // Provider-specific user ID
  displayName: text("display_name").notNull(),
  email: text("email"), // Optional, not all providers provide email
  pictureUrl: text("picture_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"), // Optional, not all providers provide refresh tokens
  sessionId: text("session_id").notNull().unique(),
  metadata: text("metadata"), // JSON string for provider-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
