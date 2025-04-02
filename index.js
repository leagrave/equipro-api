/// app/db/index.ts

// import { neon } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-http';
// import { UserMessages } from './schema';

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL must be a Neon postgres connection string');
// }

// const sql = neon(process.env.DATABASE_URL);

// export const db = drizzle(sql, {
//   schema: { UserMessages },
// });


require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
