import {
  uuid,
  pgTable,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);

export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: userRoleEnum().notNull().default('USER'),
  password: text().notNull(),
  salt: text().notNull(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
export const urlsTable = pgTable('urls', {
  id: uuid().primaryKey().defaultRandom(),

  shortCode: varchar('code', { length: 155 }).notNull().unique(),
  targetURL: text('target_url').notNull(),

  userId: uuid('user_id')
    .references(() => usersTable.id)
    .notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});