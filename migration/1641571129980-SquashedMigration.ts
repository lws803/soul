import { MigrationInterface, QueryRunner } from 'typeorm';

export class SquashedMigration1641571129980 implements MigrationInterface {
  name = 'SquashedMigration1641571129980';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`user_handle\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`hashed_password\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7408d3a73b446527a875a312d4\` (\`user_handle\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`platforms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`name_handle\` varchar(255) NULL, \`host_url\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9a4647eddfb970ff1db96fd2e5\` (\`name_handle\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`platform_users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`roles\` json NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`platform_id\` int NULL, UNIQUE INDEX \`IDX_9a2328071f3e0ff4b0836cffc8\` (\`user_id\`, \`platform_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`refresh_tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`isRevoked\` tinyint NOT NULL, \`expires\` datetime NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`platform_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_connections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`from_user_id\` int NULL, \`to_user_id\` int NULL, UNIQUE INDEX \`IDX_89fbb46e0b112a12798cc1ee60\` (\`from_user_id\`, \`to_user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_connections_platforms_platforms\` (\`platforms\` int NOT NULL, \`user_connections\` int NOT NULL, INDEX \`IDX_b8d967668686ea5db2e91449d7\` (\`platforms\`), INDEX \`IDX_48a424a351fb7acbbf53ed734c\` (\`user_connections\`), PRIMARY KEY (\`platforms\`, \`user_connections\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` ADD CONSTRAINT \`FK_f48bdedbdc9ce9ed23392fdc4b4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` ADD CONSTRAINT \`FK_1d2a9b39f3477e0aa97a996d711\` FOREIGN KEY (\`platform_id\`) REFERENCES \`platforms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_3ddc983c5f7bcf132fd8732c3f4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` ADD CONSTRAINT \`FK_cbee9c76a74c6146e1301629edc\` FOREIGN KEY (\`platform_user_id\`) REFERENCES \`platform_users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` ADD CONSTRAINT \`FK_cb08c09787fc9b7283feb3a7f51\` FOREIGN KEY (\`from_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` ADD CONSTRAINT \`FK_4b78485d215013ef730563ced8c\` FOREIGN KEY (\`to_user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections_platforms_platforms\` ADD CONSTRAINT \`FK_b8d967668686ea5db2e91449d7b\` FOREIGN KEY (\`platforms\`) REFERENCES \`user_connections\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections_platforms_platforms\` ADD CONSTRAINT \`FK_48a424a351fb7acbbf53ed734c2\` FOREIGN KEY (\`user_connections\`) REFERENCES \`platforms\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_connections_platforms_platforms\` DROP FOREIGN KEY \`FK_48a424a351fb7acbbf53ed734c2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections_platforms_platforms\` DROP FOREIGN KEY \`FK_b8d967668686ea5db2e91449d7b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` DROP FOREIGN KEY \`FK_4b78485d215013ef730563ced8c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` DROP FOREIGN KEY \`FK_cb08c09787fc9b7283feb3a7f51\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_cbee9c76a74c6146e1301629edc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_tokens\` DROP FOREIGN KEY \`FK_3ddc983c5f7bcf132fd8732c3f4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` DROP FOREIGN KEY \`FK_1d2a9b39f3477e0aa97a996d711\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`platform_users\` DROP FOREIGN KEY \`FK_f48bdedbdc9ce9ed23392fdc4b4\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_48a424a351fb7acbbf53ed734c\` ON \`user_connections_platforms_platforms\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b8d967668686ea5db2e91449d7\` ON \`user_connections_platforms_platforms\``,
    );
    await queryRunner.query(
      `DROP TABLE \`user_connections_platforms_platforms\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_89fbb46e0b112a12798cc1ee60\` ON \`user_connections\``,
    );
    await queryRunner.query(`DROP TABLE \`user_connections\``);
    await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9a2328071f3e0ff4b0836cffc8\` ON \`platform_users\``,
    );
    await queryRunner.query(`DROP TABLE \`platform_users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_9a4647eddfb970ff1db96fd2e5\` ON \`platforms\``,
    );
    await queryRunner.query(`DROP TABLE \`platforms\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_7408d3a73b446527a875a312d4\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
