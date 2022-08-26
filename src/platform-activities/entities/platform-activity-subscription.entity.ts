import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Platform } from '../../platforms/entities/platform.entity';

@Unique(['fromPlatform', 'toPlatform'])
@Entity({ name: 'platform_activity_subscription' })
export class PlatformActivitySubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Platform, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn([{ name: 'from_platform_id', referencedColumnName: 'id' }])
  fromPlatform: Platform;

  @ManyToOne(() => Platform, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn([{ name: 'to_platform_id', referencedColumnName: 'id' }])
  toPlatform: Platform;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
