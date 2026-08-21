import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../shared/schema";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  
  try {
    await db.insert(users).values({
      email: "admin@uprosper.com",
      password: hashedPassword,
      name: "Uprosper Admin",
      dateOfBirth: "1990-01-01",
      role: "admin"
    });
    console.log("Admin user created successfully!");
    console.log("Email: admin@uprosper.com");
    console.log("Password: Admin123!");
  } catch (err: any) {
    if (err.code === "23505") {
      console.log("Admin user already exists");
    } else {
      throw err;
    }
  }
  await pool.end();
  process.exit(0);
}

createAdmin();
