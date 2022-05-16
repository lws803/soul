import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'platform_categories' })
export class PlatformCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
