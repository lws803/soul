-- AlterTable
ALTER TABLE `platforms` MODIFY `is_verified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` MODIFY `is_active` BOOLEAN NOT NULL DEFAULT false;
