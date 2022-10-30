-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timestamp` BIGINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `IDX_6b0e6556c6dddaad1ab2c6fbe5`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roles` JSON NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `user_id` INTEGER NULL,
    `platform_id` INTEGER NULL,
    `profile_url` VARCHAR(255) NULL,

    INDEX `FK_1d2a9b39f3477e0aa97a996d711`(`platform_id`),
    UNIQUE INDEX `IDX_9a2328071f3e0ff4b0836cffc8`(`user_id`, `platform_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platforms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `name_handle` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `is_verified` TINYINT NOT NULL DEFAULT 0,
    `redirect_uris` JSON NOT NULL,
    `platform_category_id` INTEGER NULL,
    `activity_webhook_uri` VARCHAR(255) NULL,
    `client_secret` VARCHAR(255) NULL,
    `homepage_url` VARCHAR(255) NULL,

    UNIQUE INDEX `IDX_9a4647eddfb970ff1db96fd2e5`(`name_handle`),
    INDEX `FK_36ae51f292e99bb131443b47390`(`platform_category_id`),
    INDEX `IDX_6add27e349b6905c85e016fa2c`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platforms_user_connections_user_connections` (
    `user_connection_id` INTEGER NOT NULL,
    `platform_id` INTEGER NOT NULL,

    INDEX `IDX_68497f3c1d20e50b6701fd2771`(`platform_id`),
    INDEX `IDX_ec16e6694ea1e9b32c032f2088`(`user_connection_id`),
    PRIMARY KEY (`user_connection_id`, `platform_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `is_revoked` BOOLEAN NOT NULL,
    `expires` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `user_id` INTEGER NULL,
    `platform_user_id` INTEGER NULL,

    INDEX `FK_3ddc983c5f7bcf132fd8732c3f4`(`user_id`),
    INDEX `FK_cbee9c76a74c6146e1301629edc`(`platform_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_connections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `from_user_id` INTEGER NULL,
    `to_user_id` INTEGER NULL,
    `opposite_user_connection_id` INTEGER NULL,

    UNIQUE INDEX `REL_e5af0196967d64092604220d02`(`opposite_user_connection_id`),
    INDEX `FK_4b78485d215013ef730563ced8c`(`to_user_id`),
    UNIQUE INDEX `IDX_89fbb46e0b112a12798cc1ee60`(`from_user_id`, `to_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_connections_platforms_platforms` (
    `platform_id` INTEGER NOT NULL,
    `user_connection_id` INTEGER NOT NULL,

    INDEX `IDX_44980a74eaf800d40e4ad89d06`(`user_connection_id`),
    INDEX `IDX_a464a03734dd2d3f6d2b9d8e9d`(`platform_id`),
    PRIMARY KEY (`platform_id`, `user_connection_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `user_handle` VARCHAR(255) NULL,
    `email` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `hashed_password` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `display_name` VARCHAR(255) NULL,
    `bio` VARCHAR(255) NULL,

    UNIQUE INDEX `IDX_fe0bb3f6520ee0469504521e71`(`username`),
    UNIQUE INDEX `IDX_7408d3a73b446527a875a312d4`(`user_handle`),
    UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `platform_users` ADD CONSTRAINT `FK_1d2a9b39f3477e0aa97a996d711` FOREIGN KEY (`platform_id`) REFERENCES `platforms`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `platform_users` ADD CONSTRAINT `FK_f48bdedbdc9ce9ed23392fdc4b4` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `platforms` ADD CONSTRAINT `FK_36ae51f292e99bb131443b47390` FOREIGN KEY (`platform_category_id`) REFERENCES `platform_categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `platforms_user_connections_user_connections` ADD CONSTRAINT `FK_68497f3c1d20e50b6701fd27716` FOREIGN KEY (`platform_id`) REFERENCES `user_connections`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `platforms_user_connections_user_connections` ADD CONSTRAINT `FK_ec16e6694ea1e9b32c032f2088e` FOREIGN KEY (`user_connection_id`) REFERENCES `platforms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_3ddc983c5f7bcf132fd8732c3f4` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_cbee9c76a74c6146e1301629edc` FOREIGN KEY (`platform_user_id`) REFERENCES `platform_users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections` ADD CONSTRAINT `FK_4b78485d215013ef730563ced8c` FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections` ADD CONSTRAINT `FK_cb08c09787fc9b7283feb3a7f51` FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections` ADD CONSTRAINT `FK_e5af0196967d64092604220d029` FOREIGN KEY (`opposite_user_connection_id`) REFERENCES `user_connections`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections_platforms_platforms` ADD CONSTRAINT `FK_44980a74eaf800d40e4ad89d066` FOREIGN KEY (`user_connection_id`) REFERENCES `platforms`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_connections_platforms_platforms` ADD CONSTRAINT `FK_a464a03734dd2d3f6d2b9d8e9d6` FOREIGN KEY (`platform_id`) REFERENCES `user_connections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
