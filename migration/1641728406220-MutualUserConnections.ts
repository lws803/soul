import { MigrationInterface, QueryRunner } from 'typeorm';

export class MutualUserConnections1641728406220 implements MigrationInterface {
  name = 'MutualUserConnections1641728406220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` ADD \`opposite_user_connection_id\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` ADD UNIQUE INDEX \`IDX_e5af0196967d64092604220d02\` (\`opposite_user_connection_id\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_e5af0196967d64092604220d02\` ON \`user_connections\` (\`opposite_user_connection_id\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` ADD CONSTRAINT \`FK_e5af0196967d64092604220d029\` FOREIGN KEY (\`opposite_user_connection_id\`) REFERENCES \`user_connections\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` DROP FOREIGN KEY \`FK_e5af0196967d64092604220d029\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_e5af0196967d64092604220d02\` ON \`user_connections\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` DROP INDEX \`IDX_e5af0196967d64092604220d02\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_connections\` DROP COLUMN \`opposite_user_connection_id\``,
    );
  }
}
