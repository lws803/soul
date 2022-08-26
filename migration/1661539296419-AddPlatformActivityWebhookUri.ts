import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformActivityWebhookUri1661539296419
  implements MigrationInterface
{
  name = 'AddPlatformActivityWebhookUri1661539296419';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` ADD \`activity_webhook_uri\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`platforms\` DROP COLUMN \`activity_webhook_uri\``,
    );
  }
}
