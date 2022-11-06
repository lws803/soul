/*
  Warnings:

  - You are about to drop the column `name_handle` on the `platforms` table. All the data in the column will be lost.
  - You are about to drop the column `user_handle` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `IDX_9a4647eddfb970ff1db96fd2e5` ON `platforms`;

-- DropIndex
DROP INDEX `IDX_7408d3a73b446527a875a312d4` ON `users`;

-- AlterTable
ALTER TABLE `platforms` DROP COLUMN `name_handle`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `user_handle`;
