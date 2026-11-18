# RaceLink

Marathon registration system: runners sign up for races, pay and upload proof, and get a bib number. Organizers manage events, approve payments and check runners in. Deployed on AWS (EC2, RDS MySQL, S3, IAM, VPC).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- MySQL 8 (RDS on AWS) with Drizzle ORM
- Better Auth (email/password, roles: runner, organizer, admin)
- Zod
- Amazon S3 (presigned uploads, IAM role, no access keys)

## Local setup

1. Install Node 22+ and MySQL 8.
2. Create a database and a user for it.
3. `cp .env.example .env.local` and fill in the values.
4. Install and run:

```bash
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Make SQL migrations from `lib/db/schema.ts` into `database/migrations` |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:studio` | Browse the database |

Never commit `.env.local`, AWS keys or database passwords.
