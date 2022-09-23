import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  // Index,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'user_handle', nullable: true, unique: true })
  userHandle: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'hashed_password', nullable: false })
  @Exclude()
  hashedPassword: string;

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
