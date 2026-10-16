CREATE TYPE "event_type" AS ENUM ('MOD', 'WW2', 'CW', 'TRN', 'SP', 'PVP', 'OTHER');

ALTER TABLE "events"
ADD COLUMN "event_type" "event_type" NOT NULL DEFAULT 'OTHER';

-- Preserve the raw source category in event_code while normalizing legacy values here.
UPDATE "events"
SET "event_type" = CASE
    WHEN "event_code" IN ('MOD', 'WW2', 'CW', 'TRN', 'SP', 'PVP') THEN "event_code"::"event_type"
    WHEN "event_code" = 'SPC' THEN 'SP'::"event_type"
    WHEN "event_code" IN ('VIET', 'VTN') THEN 'CW'::"event_type"
    ELSE 'OTHER'::"event_type"
END;