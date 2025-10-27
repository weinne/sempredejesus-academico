DO $$
BEGIN
  ALTER TABLE "user_roles"
    DROP CONSTRAINT IF EXISTS "user_roles_user_id_users_id_fk";
  ALTER TABLE "user_roles"
    ADD CONSTRAINT "user_roles_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
END $$;

