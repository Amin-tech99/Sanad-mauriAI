# ParagraphTranslator Automated Setup Script
# This script will set up everything needed to run the application locally

Write-Host "🚀 ParagraphTranslator Automated Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to create .env file
function Create-EnvFile {
    param([string]$Password)
    
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
DATABASE_URL=postgresql://postgres:$Password@localhost:5432/sanad_db
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key-change-this-in-production-12345
PORT=5000
"@
    
    try {
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ .env file created successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to create .env file: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to create database
function Create-Database {
    param([string]$Password)
    
    Write-Host "🗄️ Creating database..." -ForegroundColor Yellow
    
    $env:PGPASSWORD = $Password
    
    try {
        & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE sanad_db;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database 'sanad_db' created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "ℹ️ Database might already exist, continuing..." -ForegroundColor Yellow
            return $true
        }
    }
    catch {
        Write-Host "❌ Failed to create database: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install Node.js dependencies
function Install-Dependencies {
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Failed to install dependencies: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to setup database schema
function Setup-DatabaseSchema {
    Write-Host "🏗️ Setting up database schema..." -ForegroundColor Yellow
    
    try {
        npm run db:push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema created successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Failed to create database schema" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Failed to setup database schema: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    # Check if PostgreSQL is installed
    $postgresInstalled = Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    
    if (-not $postgresInstalled) {
        Write-Host "❌ PostgreSQL not found!" -ForegroundColor Red
        Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
        Write-Host "1. Go to https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. Download and install PostgreSQL 16" -ForegroundColor White
        Write-Host "3. Remember the password you set for the postgres user" -ForegroundColor White
        Write-Host "4. Run this script again" -ForegroundColor White
        Read-Host "Press Enter to exit"
        exit 1
    } else {
        Write-Host "✅ PostgreSQL found" -ForegroundColor Green
    }

    # Get PostgreSQL password
    $password = Read-Host "Enter the PostgreSQL postgres user password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

    # Create .env file
    if (-not (Create-EnvFile -Password $passwordPlain)) {
        Write-Host "❌ Setup failed at .env file creation" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Create database
    if (-not (Create-Database -Password $passwordPlain)) {
        Write-Host "❌ Setup failed at database creation" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Install dependencies
    if (-not (Install-Dependencies)) {
        Write-Host "❌ Setup failed at dependency installation" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Setup database schema
    if (-not (Setup-DatabaseSchema)) {
        Write-Host "❌ Setup failed at database schema creation" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Write-Host ""
    Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the application:" -ForegroundColor Cyan
    Write-Host "npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "The app will be available at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    
    $startNow = Read-Host "Would you like to start the application now? (y/n)"
    if ($startNow -eq "y" -or $startNow -eq "Y") {
        Write-Host "🚀 Starting the application..." -ForegroundColor Green
        npm run dev
    }

} catch {
    Write-Host "❌ An unexpected error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
