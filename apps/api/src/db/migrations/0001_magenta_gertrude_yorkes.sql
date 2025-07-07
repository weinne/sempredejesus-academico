CREATE TABLE IF NOT EXISTS "blacklisted_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"jti" varchar(255) NOT NULL,
	"token" varchar(1000) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"blacklisted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blacklisted_tokens_jti_unique" UNIQUE("jti")
);
