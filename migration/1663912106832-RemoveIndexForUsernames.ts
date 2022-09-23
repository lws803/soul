import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveIndexForUsernames1663912106832
  implements MigrationInterface
{
  name = 'RemoveIndexForUsernames1663912106832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\``,
    );
    await queryRunner.query(
      `CREATE FULLTEXT INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\` (\`username\`)`,
    );
  }
}
