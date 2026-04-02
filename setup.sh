#!/usr/bin/env bash
set -e

echo "========================================="
echo "  OpenDesk CRM — Local Setup"
echo "========================================="
echo ""

OS="$(uname -s)"

# ── 1. Start PostgreSQL ──
echo "→ Checking PostgreSQL..."

if command -v pg_isready &>/dev/null && pg_isready -q 2>/dev/null; then
  echo "  ✓ PostgreSQL is already running"
elif [ "$OS" = "Darwin" ]; then
  # macOS — try Homebrew
  if command -v brew &>/dev/null; then
    brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null || true
    sleep 2
  fi
elif [ "$OS" = "Linux" ]; then
  # Linux — try systemctl or pg_ctlcluster
  if command -v pg_ctlcluster &>/dev/null; then
    sudo pg_ctlcluster 16 main start 2>/dev/null || true
  elif command -v systemctl &>/dev/null; then
    sudo systemctl start postgresql 2>/dev/null || true
  fi
  sleep 2
fi

if command -v pg_isready &>/dev/null && pg_isready -q 2>/dev/null; then
  echo "  ✓ PostgreSQL is running"
else
  echo ""
  echo "  ⚠  Could not detect a running PostgreSQL instance."
  echo "     Please start PostgreSQL manually, then re-run this script."
  echo ""
  echo "     macOS:   brew install postgresql@16 && brew services start postgresql@16"
  echo "     Ubuntu:  sudo apt install postgresql && sudo systemctl start postgresql"
  echo "     Windows: Download from https://www.postgresql.org/download/windows/"
  echo ""
  exit 1
fi

# ── 2. Create database ──
echo "→ Setting up database..."

# Try to create the database (works on Mac where current user is a superuser,
# and on Linux where postgres user is available)
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw opendesk; then
  echo "  ✓ Database 'opendesk' already exists"
else
  if createdb opendesk 2>/dev/null; then
    echo "  ✓ Database 'opendesk' created"
  elif sudo -u postgres createdb opendesk 2>/dev/null; then
    echo "  ✓ Database 'opendesk' created (via postgres user)"
  else
    echo ""
    echo "  ⚠  Could not create database. Please create it manually:"
    echo "     createdb opendesk"
    echo ""
    exit 1
  fi
fi

# ── 3. Set up .env ──
echo "→ Configuring .env..."

if [ ! -f .env ]; then
  # Detect the right connection string
  # macOS Homebrew Postgres typically uses the current user with no password
  # Linux typically uses postgres user or a dedicated user
  if [ "$OS" = "Darwin" ]; then
    DB_URL="postgresql://localhost:5432/opendesk"
  else
    DB_URL="postgresql://opendesk:opendesk@localhost:5432/opendesk"
    # Try to create the opendesk role on Linux
    if command -v sudo &>/dev/null; then
      sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='opendesk'" 2>/dev/null | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER opendesk WITH PASSWORD 'opendesk' CREATEDB;" 2>/dev/null || true
    fi
  fi

  cat > .env << EOF
DATABASE_URL=${DB_URL}
NEXTAUTH_SECRET=opendesk-dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
EOF
  echo "  ✓ .env created"
else
  echo "  ✓ .env already exists (keeping current values)"
fi

# ── 4. Install dependencies ──
if [ ! -d "node_modules" ]; then
  echo "→ Installing dependencies..."
  npm install
  echo "  ✓ Dependencies installed"
else
  echo "→ Dependencies already installed"
fi

# ── 5. Push schema to database ──
echo "→ Pushing database schema..."
npx prisma db push --skip-generate 2>&1 | tail -3
npx prisma generate 2>&1 | tail -3
echo "  ✓ Database schema applied"

# ── 6. Seed the database ──
echo "→ Seeding database with demo data..."
npx prisma db seed 2>&1 | tail -5
echo "  ✓ Database seeded"

echo ""
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "  Run the dev server:  npx next dev"
echo "  Open in browser:     http://localhost:3000"
echo ""
echo "  Demo login:"
echo "    Email:    demo@opendesk.com"
echo "    Password: demo1234"
echo ""
