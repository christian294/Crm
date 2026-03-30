#!/usr/bin/env bash
set -e

echo "========================================="
echo "  OpenDesk CRM — Local Setup"
echo "========================================="
echo ""

# ── 1. Start PostgreSQL ──
echo "→ Starting PostgreSQL..."
sudo pg_ctlcluster 16 main start 2>/dev/null || true
sleep 2

if pg_isready -q; then
  echo "  ✓ PostgreSQL is running"
else
  echo "  ✗ PostgreSQL failed to start"
  exit 1
fi

# ── 2. Create database user and database ──
echo "→ Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='opendesk'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER opendesk WITH PASSWORD 'opendesk' CREATEDB;"
echo "  ✓ User 'opendesk' ready"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='opendesk'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE opendesk OWNER opendesk;"
echo "  ✓ Database 'opendesk' ready"

# ── 3. Update .env with correct credentials ──
echo "→ Updating .env..."
cat > .env << 'EOF'
DATABASE_URL=postgresql://opendesk:opendesk@localhost:5432/opendesk
NEXTAUTH_SECRET=opendesk-dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
EOF
echo "  ✓ .env configured"

# ── 4. Install dependencies (if needed) ──
if [ ! -d "node_modules" ]; then
  echo "→ Installing dependencies..."
  npm install
  echo "  ✓ Dependencies installed"
else
  echo "→ Dependencies already installed"
fi

# ── 5. Push Prisma schema to database ──
echo "→ Pushing database schema..."
npx prisma db push --skip-generate 2>&1 | tail -3
npx prisma generate 2>&1 | tail -3
echo "  ✓ Database schema applied"

# ── 6. Seed the database ──
echo "→ Seeding database with demo data..."
npx prisma db seed 2>&1 | tail -5
echo "  ✓ Database seeded"

# ── 7. Kill any existing dev server ──
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "→ Stopping existing server on port 3000..."
  kill $(lsof -ti:3000) 2>/dev/null || true
  sleep 1
fi

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "  Run the dev server:  npm run dev"
echo "  Open in browser:     http://localhost:3000"
echo ""
echo "  Demo login:"
echo "    Email:    demo@opendesk.com"
echo "    Password: demo1234"
echo ""
