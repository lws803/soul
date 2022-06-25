import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { PlatformUser } from '../../platforms/entities/platform-user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User;

  @Column({ name: 'is_revoked' })
  isRevoked: boolean;

  @ManyToOne(() => PlatformUser, {
    nullable: true,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn([{ name: 'platform_user_id', referencedColumnName: 'id' }])
  platformUser: PlatformUser;

  @Column()
  expires: Date;

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
