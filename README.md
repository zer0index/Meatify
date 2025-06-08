# Meatify - Grill Temperature Monitoring System

A modern BBQ/grill temperature monitoring application with session persistence and multi-device sharing capabilities.

## Features

### 🌡️ Temperature Monitoring
- Real-time monitoring of up to 7 temperature sensors
- Ambient and meat temperature tracking
- Customizable target temperatures
- Temperature history tracking

### 🥩 Meat Selection & Management
- Visual meat selector with images
- Preset target temperatures for different meat types
- Per-sensor meat selection and tracking

### 📱 Session Persistence
- **Local Storage**: Automatic session saving with 24-hour retention
- **File-Based Sharing**: Multi-device session synchronization
- **Session Restore**: Recovery of interrupted cooking sessions
- **Temperature History**: 100-reading history limit per sensor

### 🔄 Multi-Device Sharing
- **Docker Support**: Containerized deployment with persistent volumes
- **Real-time Sync**: Automatic session synchronization every 5 seconds
- **Conflict Resolution**: Intelligent session merging
- **Device Identification**: Unique device tracking for session management

### 📊 User Interface
- Responsive design for mobile and desktop
- Session timer with elapsed time tracking
- Manual session controls (Start/Reset/Clear)
- Live highlights and weather integration

## Quick Start

### Development Mode
```bash
npm install
npm run dev
```

### Docker Deployment (Recommended for Multi-Device)
```bash
# Build and run with persistent data
docker-compose up -d

# Or manual Docker run
docker build -t meatify .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data meatify
```

### Session Management

#### Local Development
Sessions are automatically saved to localStorage with 24-hour retention.

#### Docker/Production
Sessions are saved to `/app/data/sessions/current.json` with automatic backups and multi-device synchronization.

## Architecture

### Session Storage
- **Client-Side**: localStorage for immediate persistence
- **Server-Side**: File-based storage for multi-device sharing
- **Hybrid Approach**: Automatic fallback and synchronization

### Session Data Structure
```typescript
interface GrillSession {
  id: string
  startTime: Date | null
  isActive: boolean
  selectedMeats: Record<number, MeatType | null>
  sensorTargets: Record<number, number>
  temperatureHistory: Record<number, number[]>
  lastSaved: Date
}
```

### Auto-Session Start
Sessions automatically start when:
- Ambient sensors > 30°C
- Meat sensors > 10°C

## Configuration

### Data Persistence
- **Session Age**: 24 hours maximum
- **History Limit**: 100 temperature readings per sensor
- **Sync Interval**: 5 seconds for file-based storage
- **Backup Location**: `/app/data/backups/`

### Docker Volumes
```yaml
volumes:
  - meatify_data:/app/data  # Persistent session storage
```

## API Endpoints

- `GET /api/data` - Fetch current sensor data
- `GET /api/health` - Health check endpoint

## Development

This project uses:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Docker** for containerization

## Deployment

### Docker Compose (Recommended)
```bash
git clone <repository>
cd meatify
docker-compose up -d
```

### Manual Docker
```bash
docker build -t meatify .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name meatify \
  meatify
```

### Vercel/Cloud
The application can be deployed to any Node.js hosting platform. Note that file-based session sharing requires persistent storage.

## License

MIT License - see LICENSE file for details.
