-- This file was automatically created by Diesel to setup helper functions
-- and other internal bookkeeping. This file is safe to edit, any future
-- changes will be added to existing projects as new migrations.

CREATE TABLE "user" (
  "id" text PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "salt" text NOT NULL,
  "role" int4 DEFAULT 0 NOT NULL,
  "cur_token" text,
  "phone" text,
  "student_number" text,
  "realname" text,
  "slogan" text,
  "avatar" text,
  "sso_data" text,
  "email" text,
  "email_verified" bool DEFAULT false
);

COMMENT ON COLUMN "user"."id" IS '用户ID';
COMMENT ON COLUMN "user"."username" IS '用户名';
COMMENT ON COLUMN "user"."password" IS '密码';
COMMENT ON COLUMN "user"."role" IS '角色';
COMMENT ON COLUMN "user"."cur_token" IS '当前登录的Token';
COMMENT ON COLUMN "user"."phone" IS '电话号码';
COMMENT ON COLUMN "user"."student_number" IS '学号';
COMMENT ON COLUMN "user"."realname" IS '姓名';
COMMENT ON COLUMN "user"."slogan" IS '签名';
COMMENT ON COLUMN "user"."avatar" IS '头像';
COMMENT ON COLUMN "user"."sso_data" IS '统一验证的数据';
COMMENT ON COLUMN "user"."email" IS '邮箱地址';
COMMENT ON COLUMN "user"."email_verified" IS '邮箱是否验证';



-- Sets up a trigger for the given table to automatically set a column called
-- `updated_at` whenever the row is modified (unless `updated_at` was included
-- in the modified columns)
--
-- # Example
--
-- ```sql
-- CREATE TABLE users (id SERIAL PRIMARY KEY, updated_at TIMESTAMP NOT NULL DEFAULT NOW());
--
-- SELECT diesel_manage_updated_at('users');
-- ```
CREATE OR REPLACE FUNCTION diesel_manage_updated_at(_tbl regclass) RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
                    FOR EACH ROW EXECUTE PROCEDURE diesel_set_updated_at()', _tbl);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION diesel_set_updated_at() RETURNS trigger AS $$
BEGIN
    IF (
        NEW IS DISTINCT FROM OLD AND
        NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at
    ) THEN
        NEW.updated_at := current_timestamp;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
