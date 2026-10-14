-- Preserve existing Steam accounts and provision one Player for each current user.
CREATE TYPE "log_line_type" AS ENUM ('OTHER', 'PLAYER_CONNECTING', 'PLAYER_CONNECTED', 'PLAYER_DISCONNECTED');

CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "nickname" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);
INSERT INTO "players" ("id", "user_id", "nickname", "created_at", "updated_at")
SELECT "id", "id", "display_name", "created_at", "updated_at"
FROM "users";
CREATE UNIQUE INDEX "players_user_id_key" ON "players"("user_id");
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "source_file_name" TEXT,
    "source_sha256" VARCHAR(64),
    "title" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "game" TEXT,
    "event_date" DATE NOT NULL,
    "server_time_zone" TEXT,
    "mission_duration_minutes" INTEGER,
    "minimum_attendance_minutes" INTEGER,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "events_source_key_key" ON "events"("source_key");
CREATE INDEX "events_event_date_idx" ON "events"("event_date");
CREATE INDEX "events_event_code_event_date_idx" ON "events"("event_code", "event_date");

CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "total_connected_seconds" INTEGER,
    "attendance_granted" BOOLEAN NOT NULL DEFAULT false,
    "attendance_calculated_at" TIMESTAMP(3),
    "attendance_override" BOOLEAN,
    "attendance_override_reason" TEXT,
    "calculation_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_participants_event_id_player_id_key" ON "event_participants"("event_id", "player_id");
CREATE INDEX "event_participants_player_id_idx" ON "event_participants"("player_id");
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "event_log_lines" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "raw_text" TEXT NOT NULL,
    "time_of_day" VARCHAR(8),
    "type" "log_line_type" NOT NULL DEFAULT 'OTHER',
    "reported_player_name" TEXT,
    "reported_steam_id" TEXT,
    "player_id" TEXT,
    "parse_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_log_lines_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_log_lines_event_id_line_number_key" ON "event_log_lines"("event_id", "line_number");
CREATE INDEX "event_log_lines_player_id_idx" ON "event_log_lines"("player_id");
ALTER TABLE "event_log_lines" ADD CONSTRAINT "event_log_lines_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_log_lines" ADD CONSTRAINT "event_log_lines_player_id_fkey"
    FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "player_sessions" (
    "id" TEXT NOT NULL,
    "event_participant_id" TEXT NOT NULL,
    "connect_line_id" TEXT NOT NULL,
    "disconnect_line_id" TEXT,
    "connected_at" TIMESTAMP(0) NOT NULL,
    "disconnected_at" TIMESTAMP(0),
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "player_sessions_connect_line_id_key" ON "player_sessions"("connect_line_id");
CREATE UNIQUE INDEX "player_sessions_disconnect_line_id_key" ON "player_sessions"("disconnect_line_id");
CREATE INDEX "player_sessions_event_participant_id_connected_at_idx" ON "player_sessions"("event_participant_id", "connected_at");
ALTER TABLE "player_sessions" ADD CONSTRAINT "player_sessions_event_participant_id_fkey"
    FOREIGN KEY ("event_participant_id") REFERENCES "event_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_sessions" ADD CONSTRAINT "player_sessions_connect_line_id_fkey"
    FOREIGN KEY ("connect_line_id") REFERENCES "event_log_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_sessions" ADD CONSTRAINT "player_sessions_disconnect_line_id_fkey"
    FOREIGN KEY ("disconnect_line_id") REFERENCES "event_log_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
