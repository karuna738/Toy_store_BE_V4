import { getPool } from '../../config/database';
import { IUser, IPublicUser } from '../../types';
import { RowDataPacket } from 'mysql2/promise';

export class UserRepository {
  private toPublicUser(user: IUser): IPublicUser {
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      role: user.role,
      createdAt: user.created_at
    };
  }

  public async findAll(): Promise<IPublicUser[]> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, phone, address, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return (rows as IUser[]).map(this.toPublicUser);
  }

  public async findById(id: number): Promise<IPublicUser | null> {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, email, phone, address, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    const user = rows[0] as IUser | undefined;
    return user ? this.toPublicUser(user) : null;
  }
}

export const userRepository = new UserRepository();
