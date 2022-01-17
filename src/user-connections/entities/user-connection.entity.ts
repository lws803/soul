import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Platform } from '../../platforms/entities/platform.entity';

@Unique(['fromUser', 'toUser'])
@Entity({ name: 'user_connections' })
export class UserConnection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn([{ name: 'from_user_id', referencedColumnName: 'id' }])
  fromUser: User;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn([{ name: 'to_user_id', referencedColumnName: 'id' }])
  toUser: User;

  @ManyToMany(() => Platform, (platform) => platform.userConnections)
  @JoinTable({
    joinColumn: {
      name: 'platform_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_connection_id',
      referencedColumnName: 'id',
    },
  })
  platforms: Platform[];

  @OneToOne(() => UserConnection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'opposite_user_connection_id',
    referencedColumnName: 'id',
  })
  mutualConnection: UserConnection;

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
