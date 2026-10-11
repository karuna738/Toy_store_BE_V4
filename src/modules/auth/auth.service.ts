import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { getPool } from '../../config/database';
import { env } from '../../config/env';
import { hashPassword, comparePassword } from '../../utils/password';
import { AppError } from '../../utils/appError';
import { IUser, IPublicUser, IJwtPayload } from '../../types';
import { RegisterInput, LoginInput, UpdateMeInput } from './auth.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export class AuthService {
  private generateToken(payload: IJwtPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn']
    };
    return jwt.sign(payload, env.JWT_SECRET as Secret, options);
  }

  public toPublicUser(user: IUser): IPublicUser {
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

  public async register(input: RegisterInput): Promise<{ user: IPublicUser; token: string }> {
    const pool = getPool();

    // Check email uniqueness
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [input.email]
    );

    if (existing.length > 0) {
      throw AppError.badRequest('Email already registered');
    }

    const passwordHash = await hashPassword(input.password);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (name, email, phone, address, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 1)`,
      [input.name, input.email, input.phone, input.address || null, passwordHash]
    );

    const [createdRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const createdUser = createdRows[0] as IUser | undefined;
    if (!createdUser) {
      throw AppError.internal('Failed to retrieve registered user');
    }

    const publicUser = this.toPublicUser(createdUser);
    const token = this.generateToken({ id: createdUser.id, role: createdUser.role });

    return { user: publicUser, token };
  }

  public async login(input: LoginInput): Promise<{ user: IPublicUser; token: string }> {
    const pool = getPool();

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [input.email]
    );

    const user = rows[0] as IUser | undefined;
    if (!user || !user.is_active) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(input.password, user.password_hash);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const publicUser = this.toPublicUser(user);
    const token = this.generateToken({ id: user.id, role: user.role });

    return { user: publicUser, token };
  }

  public async updateProfile(userId: number, input: UpdateMeInput): Promise<IPublicUser> {
    const pool = getPool();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      values.push(input.phone);
    }
    if (input.address !== undefined) {
      updates.push('address = ?');
      values.push(input.address);
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const updatedUser = rows[0] as IUser | undefined;
    if (!updatedUser) {
      throw AppError.notFound('User not found');
    }

    return this.toPublicUser(updatedUser);
  }
}

export const authService = new AuthService();
