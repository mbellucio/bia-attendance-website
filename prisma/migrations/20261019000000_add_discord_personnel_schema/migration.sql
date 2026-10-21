-- AlterTable
ALTER TABLE "players" ADD COLUMN     "discord_user_id" TEXT,
ADD COLUMN     "rank_id" TEXT,
ADD COLUMN     "time_served_id" TEXT;

-- CreateTable
CREATE TABLE "discord_roles" (
    "id" TEXT NOT NULL,
    "discord_role_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ribbons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "ribbon_path" TEXT,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ribbons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competences" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_served" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "ribbon_path" TEXT,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_served_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miscellaneous" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "discord_role_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miscellaneous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_departments" (
    "player_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "player_departments_pkey" PRIMARY KEY ("player_id","department_id")
);

-- CreateTable
CREATE TABLE "player_ribbons" (
    "player_id" TEXT NOT NULL,
    "ribbon_id" TEXT NOT NULL,

    CONSTRAINT "player_ribbons_pkey" PRIMARY KEY ("player_id","ribbon_id")
);

-- CreateTable
CREATE TABLE "player_competences" (
    "player_id" TEXT NOT NULL,
    "competence_id" TEXT NOT NULL,

    CONSTRAINT "player_competences_pkey" PRIMARY KEY ("player_id","competence_id")
);

-- CreateTable
CREATE TABLE "player_miscellaneous" (
    "player_id" TEXT NOT NULL,
    "miscellaneous_id" TEXT NOT NULL,

    CONSTRAINT "player_miscellaneous_pkey" PRIMARY KEY ("player_id","miscellaneous_id")
);

-- CreateTable
CREATE TABLE "player_roles" (
    "player_id" TEXT NOT NULL,
    "discord_role_id" TEXT NOT NULL,

    CONSTRAINT "player_roles_pkey" PRIMARY KEY ("player_id","discord_role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discord_roles_discord_role_id_key" ON "discord_roles"("discord_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_discord_role_id_key" ON "departments"("discord_role_id");

-- CreateIndex
CREATE INDEX "departments_parent_id_sort_order_idx" ON "departments"("parent_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_code_key" ON "ranks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_discord_role_id_key" ON "ranks"("discord_role_id");

-- CreateIndex
CREATE INDEX "ranks_sort_order_idx" ON "ranks"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "ribbons_discord_role_id_key" ON "ribbons"("discord_role_id");

-- CreateIndex
CREATE INDEX "ribbons_sort_order_idx" ON "ribbons"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "competences_discord_role_id_key" ON "competences"("discord_role_id");

-- CreateIndex
CREATE INDEX "competences_sort_order_idx" ON "competences"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "time_served_code_key" ON "time_served"("code");

-- CreateIndex
CREATE UNIQUE INDEX "time_served_discord_role_id_key" ON "time_served"("discord_role_id");

-- CreateIndex
CREATE INDEX "time_served_sort_order_idx" ON "time_served"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "miscellaneous_discord_role_id_key" ON "miscellaneous"("discord_role_id");

-- CreateIndex
CREATE INDEX "miscellaneous_sort_order_idx" ON "miscellaneous"("sort_order");

-- CreateIndex
CREATE INDEX "player_departments_department_id_idx" ON "player_departments"("department_id");

-- CreateIndex
CREATE INDEX "player_ribbons_ribbon_id_idx" ON "player_ribbons"("ribbon_id");

-- CreateIndex
CREATE INDEX "player_competences_competence_id_idx" ON "player_competences"("competence_id");

-- CreateIndex
CREATE INDEX "player_miscellaneous_miscellaneous_id_idx" ON "player_miscellaneous"("miscellaneous_id");

-- CreateIndex
CREATE INDEX "player_roles_discord_role_id_idx" ON "player_roles"("discord_role_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_discord_user_id_key" ON "players"("discord_user_id");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "ranks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_time_served_id_fkey" FOREIGN KEY ("time_served_id") REFERENCES "time_served"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranks" ADD CONSTRAINT "ranks_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ribbons" ADD CONSTRAINT "ribbons_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competences" ADD CONSTRAINT "competences_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_served" ADD CONSTRAINT "time_served_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miscellaneous" ADD CONSTRAINT "miscellaneous_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_departments" ADD CONSTRAINT "player_departments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_departments" ADD CONSTRAINT "player_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ribbons" ADD CONSTRAINT "player_ribbons_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_ribbons" ADD CONSTRAINT "player_ribbons_ribbon_id_fkey" FOREIGN KEY ("ribbon_id") REFERENCES "ribbons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_competences" ADD CONSTRAINT "player_competences_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_competences" ADD CONSTRAINT "player_competences_competence_id_fkey" FOREIGN KEY ("competence_id") REFERENCES "competences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_miscellaneous" ADD CONSTRAINT "player_miscellaneous_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_miscellaneous" ADD CONSTRAINT "player_miscellaneous_miscellaneous_id_fkey" FOREIGN KEY ("miscellaneous_id") REFERENCES "miscellaneous"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_roles" ADD CONSTRAINT "player_roles_discord_role_id_fkey" FOREIGN KEY ("discord_role_id") REFERENCES "discord_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
