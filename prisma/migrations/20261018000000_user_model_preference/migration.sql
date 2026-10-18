CREATE TYPE "soldier_faction" AS ENUM ('US', 'GERMANY', 'SOVIET_UNION');

CREATE TABLE "user_model_preferences" (
    "user_id" TEXT NOT NULL,
    "faction" "soldier_faction" NOT NULL DEFAULT 'US',
    "model_path" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_model_preferences_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "user_model_preferences"
ADD CONSTRAINT "user_model_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;