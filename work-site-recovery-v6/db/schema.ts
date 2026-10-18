import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {
 code:text('code').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),language:text('language').notNull(),teams:integer('teams').notNull(),activities:text('activities').notNull(),status:text('status').notNull(),current:integer('current').notNull(),revision:integer('revision').notNull(),startedAt:integer('started_at'),deadline:integer('deadline'),paused:integer('paused').notNull(),remaining:integer('remaining').notNull(),reveal:integer('reveal'),createdAt:integer('created_at').notNull(),settings:text('settings'),blueprint:text('blueprint'),runtime:text('runtime'),anonymousSecret:text('anonymous_secret'),survey:text('survey'),
});
export const players = sqliteTable('players', {
 session:text('session').notNull(),id:text('id').notNull(),token:text('token').notNull(),name:text('name').notNull(),team:text('team'),eligibleFrom:integer('eligible_from').notNull(),joinedAt:integer('joined_at').notNull(),employeeKey:text('employee_key'),employeeId:text('employee_id'),recoveryHash:text('recovery_hash'),approval:text('approval').notNull().default('approved'),language:text('language').notNull().default('ar'),
},t=>[primaryKey({columns:[t.session,t.id]}),uniqueIndex('players_session_employee').on(t.session,t.employeeKey)]);
export const answers = sqliteTable('answers', {
 session:text('session').notNull(),round:integer('round').notNull(),player:text('player').notNull(),answer:text('answer').notNull(),points:integer('points').notNull(),correct:integer('correct'),elapsedMs:integer('elapsed_ms').notNull().default(0),createdAt:integer('created_at').notNull(),
},t=>[primaryKey({columns:[t.session,t.round,t.player]})]);
export const trainerLinks=sqliteTable('trainer_links',{
 siteUser:text('site_user').primaryKey(),firebaseUid:text('firebase_uid').notNull(),createdAt:integer('created_at').notNull(),
});
export const drafts=sqliteTable('drafts',{id:text('id').primaryKey(),owner:text('owner').notNull(),title:text('title').notNull(),payload:text('payload').notNull(),kind:text('kind').notNull(),visibility:text('visibility').notNull(),version:integer('version').notNull(),updatedAt:integer('updated_at').notNull()});
export const progress=sqliteTable('progress',{session:text('session').notNull(),round:integer('round').notNull(),actor:text('actor').notNull(),data:text('data').notNull(),version:integer('version').notNull()},t=>[primaryKey({columns:[t.session,t.round,t.actor]})]);
export const events=sqliteTable('events',{session:text('session').notNull(),id:text('id').notNull(),player:text('player').notNull(),round:integer('round').notNull(),kind:text('kind').notNull(),points:integer('points').notNull(),detail:text('detail').notNull(),createdAt:integer('created_at').notNull()},t=>[primaryKey({columns:[t.session,t.id]})]);
export const anonymousResponses=sqliteTable('anonymous_responses',{session:text('session').notNull(),round:integer('round').notNull(),receipt:text('receipt').notNull(),answer:text('answer').notNull(),createdAt:integer('created_at').notNull()},t=>[primaryKey({columns:[t.session,t.round,t.receipt]})]);
export const audits=sqliteTable('audits',{id:text('id').primaryKey(),session:text('session'),owner:text('owner').notNull(),action:text('action').notNull(),detail:text('detail').notNull(),createdAt:integer('created_at').notNull()});
export const trainerProfiles=sqliteTable('trainer_profiles',{uid:text('uid').primaryKey(),email:text('email').notNull(),name:text('name').notNull(),role:text('role').notNull(),enabled:integer('enabled').notNull(),reportOwners:text('report_owners').notNull(),updatedAt:integer('updated_at').notNull()});
export const settings=sqliteTable('settings',{id:text('id').primaryKey(),payload:text('payload').notNull(),updatedAt:integer('updated_at').notNull()});
export const rateBuckets=sqliteTable('rate_buckets',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
