-- Move the linked Discord account identifier from Player to User.
-- Abort if an identity has no linked User, rather than silently discarding it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "players"
    WHERE "discord_user_id" IS NOT NULL AND "user_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot move discord_user_id: one or more players have no linked user account';
  END IF;
END $$;

ALTER TABLE "users" ADD COLUMN "discord_user_id" TEXT;

UPDATE "users" AS u
SET "discord_user_id" = p."discord_user_id"
FROM "players" AS p
WHERE p."user_id" = u."id"
  AND p."discord_user_id" IS NOT NULL;

DROP INDEX "players_discord_user_id_key";
ALTER TABLE "players" DROP COLUMN "discord_user_id";
CREATE UNIQUE INDEX "users_discord_user_id_key" ON "users"("discord_user_id");