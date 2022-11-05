/*
  Warnings:

  - You are about to drop the `platforms_user_connections_user_connections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_connections_platforms_platforms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `platforms_user_connections_user_connections` DROP FOREIGN KEY `FK_68497f3c1d20e50b6701fd27716`;

-- DropForeignKey
ALTER TABLE `platforms_user_connections_user_connections` DROP FOREIGN KEY `FK_ec16e6694ea1e9b32c032f2088e`;

-- DropForeignKey
ALTER TABLE `user_connections_platforms_platforms` DROP FOREIGN KEY `FK_44980a74eaf800d40e4ad89d066`;

-- DropForeignKey
ALTER TABLE `user_connections_platforms_platforms` DROP FOREIGN KEY `FK_a464a03734dd2d3f6d2b9d8e9d6`;

-- DropTable
DROP TABLE `platforms_user_connections_user_connections`;

-- DropTable
DROP TABLE `user_connections_platforms_platforms`;
