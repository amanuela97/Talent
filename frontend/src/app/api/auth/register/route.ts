import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const isAdmin = process.env.ADMIN_LIST
      ? process.env.ADMIN_LIST.split(',').includes(email)
      : false;

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', data: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in register api:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
