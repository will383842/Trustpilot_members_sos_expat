-- ============================================================
-- Schema : trustpilot_sos_expat
-- Version : 3.1
-- Description : Standalone DB for Trustpilot member outreach
-- ============================================================

CREATE DATABASE IF NOT EXISTS `trustpilot_sos_expat`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `trustpilot_sos_expat`;

-- ------------------------------------------------------------
-- Table : groups
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `groups` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `whatsapp_group_id`  VARCHAR(100)    NOT NULL,
  `name`               VARCHAR(255)    NOT NULL,
  `language`           VARCHAR(10)     NOT NULL DEFAULT 'fr',
  `country`            VARCHAR(100)    DEFAULT NULL,
  `continent`          VARCHAR(100)    DEFAULT NULL,
  `member_count`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `is_active`          TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_groups_whatsapp_id` (`whatsapp_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table : members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `phone_number`       VARCHAR(25)     NOT NULL,
  `display_name`       VARCHAR(255)    DEFAULT NULL,
  `primary_language`   VARCHAR(10)     NOT NULL DEFAULT 'fr',
  `primary_country`    VARCHAR(100)    DEFAULT NULL,
  `primary_continent`  VARCHAR(100)    DEFAULT NULL,
  `whatsapp_message`   TEXT            DEFAULT NULL COMMENT 'GPT-4 generated message — max 1500 chars',
  `generated_at`       TIMESTAMP       NULL DEFAULT NULL,
  `message_status`     ENUM('not_sent','sent','replied') NOT NULL DEFAULT 'not_sent',
  `message_sent_at`    TIMESTAMP       NULL DEFAULT NULL,
  `replied_at`         TIMESTAMP       NULL DEFAULT NULL,
  `notes`              TEXT            DEFAULT NULL,
  `first_seen_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_members_phone` (`phone_number`),
  KEY `idx_message_status` (`message_status`),
  KEY `idx_primary_language` (`primary_language`),
  KEY `idx_first_seen_at` (`first_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table : member_groups (pivot)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `member_groups` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id`  BIGINT UNSIGNED NOT NULL,
  `group_id`   BIGINT UNSIGNED NOT NULL,
  `joined_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at`    TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_member_group` (`member_id`, `group_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_group_id` (`group_id`),
  CONSTRAINT `fk_mg_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mg_group`  FOREIGN KEY (`group_id`)  REFERENCES `groups`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Dedicated MySQL user (run as root, adjust password)
-- ------------------------------------------------------------
-- CREATE USER 'trustpilot_user'@'localhost' IDENTIFIED BY 'CHANGE_ME';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON trustpilot_sos_expat.* TO 'trustpilot_user'@'localhost';
-- FLUSH PRIVILEGES;
