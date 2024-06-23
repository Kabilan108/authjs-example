
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      const { name, email, password } = await req.json();

      // Connect to MongoDB
      const client = await MongoClient.connect(process.env.MONGODB_URI as string);
      const db = client.db();

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        client.close();
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const result = await db.collection('users').insertOne({
        name,
        email,
        password: hashedPassword,
      });

      client.close();

      return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
}
