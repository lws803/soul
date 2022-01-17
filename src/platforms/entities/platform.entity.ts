import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';

import { UserConnection } from '../../user-connections/entities/user-connection.entity';
@Entity({ name: 'platforms' })
export class Platform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'name_handle', nullable: true, unique: true })
  nameHandle: string;

  @Column({ name: 'host_url' })
  hostUrl: string;

  @ManyToMany(
    () => UserConnection,
    (userConnection) => userConnection.platforms,
  )
  @JoinTable({
    joinColumn: {
      name: 'user_connection_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'platform_id',
      referencedColumnName: 'id',
    },
  })
  userConnections: UserConnection[];

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
