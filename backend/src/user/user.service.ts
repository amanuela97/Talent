import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { SafeUser } from '../backendTypes';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  /**
   * Create a new user
   * @param dto User creation data
   * @returns Created user without password hash
   */
  async create(dto: CreateUserDto): Promise<SafeUser> {
    try {
      // Check if user exists - use a transaction for atomicity
      const existingUser = await this.findByEmail(dto.email);

      if (existingUser) {
        throw new ConflictException('Account already exists');
      }

      // Hash password
      const passwordHash = await hash(dto.password, this.SALT_ROUNDS);

      const isAdmin = this.configService
        .get<string>('ADMIN_LIST')
        ?.split(',')
        .includes(dto.email);

      // Create user
      const newUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: isAdmin ? 'ADMIN' : 'CUSTOMER',
          passwordHash,
          authProvider: 'CREDENTIALS',
        },
        select: {
          userId: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          profilePicture: true,
          authProvider: true,
        },
      });

      return newUser as SafeUser;
    } catch (error) {
      // Handle database errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Account already exists');
        }
      }

      // For the specific prepared statement error
      if (
        error instanceof Error &&
        error.message.includes('prepared statement')
      ) {
        await this.prisma.cleanupTransactions();
        // Try again with the operation
        return this.create(dto);
      }

      throw error;
    }
  }

  async createUserWithGoogle({
    email,
    name,
    profilePicture,
    role,
    account,
  }: {
    email: string;
    name: string;
    profilePicture: string | null;
    role: 'ADMIN' | 'CUSTOMER';
    account: {
      provider: string;
      providerAccountId: string;
      accessToken: string;
      expiresAt?: number;
    };
  }) {
    const passwordHash = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      10,
    );

    return this.prisma.user.create({
      data: {
        email,
        name,
        profilePicture,
        role,
        authProvider: 'GOOGLE',
        passwordHash,
        accounts: {
          create: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.accessToken,
            expiresAt: account.expiresAt,
          },
        },
      },
    });
  }

  /**
   * Find user by email
   * @param email User email
   * @returns User or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return user;
  }

  /**
   * Find user by ID
   * @param id User ID
   * @returns User or null
   */
  async findById(id: string): Promise<SafeUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { userId: id },
    });

    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  /**
   * Get all users
   * @returns Array of users
   */
  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ passwordHash: _, ...rest }) => rest);
  }

  /**
   * Delete user by ID
   * @param id User ID
   * @returns Deleted user without password hash
   */
  async remove(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const deletedUser = await this.prisma.user.delete({
      where: { userId: id },
      omit: {
        passwordHash: true,
      },
    });

    return deletedUser;
  }

  /**
   * Update user by ID
   * @param id User ID
   * @param updateData Update data
   * @returns Updated user without password hash
   */
  async update(id: string, updateData: UpdateUserDto): Promise<SafeUser> {
    // Check if user exists
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prepare update data
    const data: UpdateUserDto = { ...updateData };
    let passwordHash: string | null = null;
    // Hash new password if provided
    if (updateData.password) {
      passwordHash = await hash(updateData.password, this.SALT_ROUNDS);
      delete data.password;
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { userId: id },
      data: {
        ...data,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }
}
