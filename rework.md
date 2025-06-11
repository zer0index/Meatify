# Meatify TV Dashboard Redesign - Comprehensive Rework Plan

## 📋 Project Overview

**Goal**: Redesign the Meatify grill monitor for optimal TV viewing experience using Concept 1 layout:
- Top bar with session/weather/alerts/sync info
- Single horizontal row of large meat sensor cards (main focus)
- Bottom section with grill temperature, live highlights, and weather details

**Current State Analysis Completed**: ✅
- Components: grill-monitor.tsx, meat-sensor-card.tsx, ambient-sensor-card.tsx, live-highlights-card.tsx, weather-widget.tsx
- Data Sources: Node-RED (192.168.0.168:1880), POST API fallback, mock data
- Session Management: Persistent storage with sync capabilities
- APIs: /api/data (GET/POST), /api/session, /api/health
- Styling: Tailwind CSS with custom animations and gradients

---

## 📊 Current Data Architecture

### Data Sources & Endpoints
```
1. Node-RED Primary: http://192.168.0.168:1880/sensors
2. POST Fallback: /api/data (accepts sensor arrays)
3. Mock Data: createMockSensorsWithHistory() in historyUtils.ts
4. Weather API: Open-Meteo (Hallein, Austria coordinates)
5. Session Storage: localStorage + server sync via /api/session
```

### Sensor Data Structure
```typescript
interface Sensor {
  id: number              // 0-1: grill sensors, 2-6: meat sensors
  currentTemp: number     // Current temperature in Celsius
  targetTemp: number      // Target temperature in Celsius
  history: number[]       // Last 15 readings for charts
}

interface TemperatureReading {
  temperature: number
  timestamp: Date
}

interface GrillSession {
  id: string
  startTime: Date | null
  isActive: boolean
  selectedMeats: Record<number, MeatType | null>  // Sensors 2-6
  sensorTargets: Record<number, number>
  temperatureHistory: Record<number, TemperatureReading[]>
  lastSaved: Date
}
```

### Meat Types & Images
```typescript
// Available in /public/images/
- beef_brisket.jpg    → "Beef Brisket"
- beef_ribs.jpg       → "Beef Ribs" 
- beef_tenderloin.jpg → "Beef Tenderloin"
- pork_shoulder.jpg   → "Pork Shoulder"
- pork_ribs.jpg       → "Pork Ribs"
- pork_tenderloin.jpg → "Pork Tenderloin"
- chicken_breast.jpg  → "Chicken Breast"
- chicken_thigh.jpg   → "Chicken Thigh"
- lamb_chops.jpg      → "Lamb Chops"
```

---

## 🎯 Target Layout (Concept 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│ SESSION: 2h 45m | WEATHER: 75°F ☀️ | ALERTS: 🔥 Ready! | SYNC: ✅   │
├─────────────────────────────────────────────────────────────────────┤
│                        MEAT PROBE SENSORS                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──│
│ │  PROBE 1    │ │  PROBE 2    │ │  PROBE 3    │ │  PROBE 4    │ │ P│
│ │ 🥩 BRISKET  │ │🐖 PORK      │ │🐔 CHICKEN   │ │🐑 LAMB      │ │ [│
│ │   145°F     │ │  165°F      │ │  135°F      │ │  125°F      │ │  │
│ │████████████ │ │████████████ │ │████████     │ │████████     │ │──│
│ │Target: 203°F│ │Target: 195°F│ │Target: 165°F│ │Target: 145°F│ │Se│
│ │📊 Rising    │ │🔥 Almost!   │ │📈 Heating   │ │✅ Ready!    │ │👆│
│ │⏱️ 2h 15m    │ │⏱️ 45m       │ │⏱️ 1h 30m   │ │⏱️ Done      │ │  │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └──│
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────────┐ │
│ │GRILL TEMP   │ │LIVE ALERTS  │ │          WEATHER DETAILS        │ │
│ │Grill1: 275°F│ │🔥 Pork Done │ │🌤️ 75°F Partly Cloudy           │ │
│ │Grill2: 280°F│ │📊 Avg Rising│ │💨 5mph Wind │ 💧 45% Humidity   │ │
│ └─────────────┘ └─────────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Phase-by-Phase Implementation Plan

## 🔄 Phase 1: Core Layout Structure (Week 1)

### 1.1 Create New TV Dashboard Component
**File**: `components/tv-grill-monitor.tsx`
```typescript
// New main TV dashboard component
// Replaces current grill-monitor.tsx for TV mode
// Implements Concept 1 layout structure
```

**Tasks**:
- [ ] Create base component with CSS Grid layout
- [ ] Implement responsive breakpoints for TV screens (1920px+)
- [ ] Add device detection logic (TV vs Desktop vs Mobile)
- [ ] Set up proper z-index layering for background video

### 1.2 Update Main Route Logic
**File**: `app/grill/page.tsx`
```typescript
// Add device detection and route to appropriate component
// Keep existing mobile-dashboard for small screens
// Use tv-grill-monitor for large screens (1920px+)
```

### 1.3 Create Layout Grid System
**File**: `components/ui/tv-grid.tsx`
```typescript
// Reusable grid system for TV layouts
// Named grid areas for flexible positioning
// Container queries for responsive behavior
```

**CSS Grid Areas**:
```css
.tv-grid {
  display: grid;
  grid-template-areas:
    "header header header"
    "meat-sensors meat-sensors meat-sensors"
    "grill-temp live-highlights weather";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  height: 100vh;
  padding: 1rem;
}
```

---

## 🥩 Phase 2: Enhanced Meat Sensor Cards (Week 2)

### 2.1 Create Large TV-Optimized Meat Cards
**File**: `components/tv-meat-sensor-card.tsx`

**Key Features**:
- [ ] **Large Typography**: 48px+ temperature display
- [ ] **Enhanced Progress Bars**: Thick, animated progress indicators
- [ ] **Meat Type Images**: Large, prominent meat visuals
- [ ] **Status Icons**: Animated cooking stage indicators
- [ ] **Time Displays**: Large countdown timers
- [ ] **Trend Arrows**: Animated temperature trend indicators

**Card Specifications**:
```typescript
interface TVMeatCardProps {
  sensor: Sensor
  selectedMeat: MeatType | null
  sessionHistory?: TemperatureReading[]
  isCelsius: boolean
  onMeatSelectorClick: () => void
  onTargetTempChange: (temp: number) => void
  isLarge?: boolean  // TV mode vs compact mode
}
```

**Dimensions**: 
- Width: ~380px (for 5 cards across 1920px screen)
- Height: ~320px (generous vertical space)
- Padding: 24px
- Border radius: 16px

### 2.2 Advanced Animation System
**File**: `lib/animations.ts`

**Animation Types**:
- [ ] **Temperature Pulse**: Breathing effect for active sensors
- [ ] **Progress Fill**: Smooth temperature progress animations
- [ ] **Number Counter**: Rolling number animations for temp changes
- [ ] **Status Transitions**: Smooth state change animations
- [ ] **Alert Pulse**: Attention-grabbing alert animations

**CSS Keyframes**:
```css
@keyframes temperature-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.02); filter: brightness(1.1); }
}

@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(var(--progress)); }
}

@keyframes number-roll {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 2.3 Enhanced Meat Selector
**File**: `components/tv-meat-selector.tsx`
- [ ] Larger meat images (200px+)
- [ ] TV-friendly navigation
- [ ] Improved visual hierarchy
- [ ] Quick selection shortcuts

---

## 🔥 Phase 3: Status Bar & Information Panels (Week 3)

### 3.1 Top Status Bar Component
**File**: `components/tv-status-bar.tsx`

**Content Sections**:
```typescript
interface StatusBarData {
  session: {
    duration: string      // "2h 45m 32s"
    startTime: string     // "Started 3:15pm"
    isActive: boolean
  }
  weather: {
    temperature: number
    condition: string
    icon: string
  }
  alerts: {
    priority: 'none' | 'info' | 'warning' | 'critical'
    message: string
    count: number
  }
  sync: {
    status: 'connected' | 'syncing' | 'offline'
    lastUpdate: Date
  }
}
```

**Features**:
- [ ] Auto-scrolling alerts for multiple notifications
- [ ] Real-time session timer with millisecond precision
- [ ] Weather icon animations
- [ ] Sync status indicators with pulse effects
- [ ] Priority-based alert coloring

### 3.2 Grill Temperature Panel
**File**: `components/tv-grill-panel.tsx`

**Enhanced Features**:
- [ ] **Large Temperature Display**: 72px font size
- [ ] **Target vs Current**: Clear visual comparison
- [ ] **Heat Zones**: Color-coded temperature ranges
- [ ] **Trend Indicators**: Rising/falling/stable arrows
- [ ] **Multiple Grill Support**: Side-by-side grill displays

### 3.3 Live Highlights Panel
**File**: `components/tv-live-highlights.tsx`

**Alert Categories**:
```typescript
interface HighlightData {
  ready: MeatSensor[]       // Meats that reached target
  almostDone: MeatSensor[]  // Within 10°F of target
  slowCooking: MeatSensor[] // Below expected progress
  overheating: Sensor[]     // Above target temperature
  trending: {
    fastest: MeatSensor
    slowest: MeatSensor
    average: number
  }
}
```

**Features**:
- [ ] Priority-based highlight rotation
- [ ] Animated progress indicators
- [ ] Auto-cycling display for multiple highlights
- [ ] Sound-responsive visual feedback

---

## 🌤️ Phase 4: Enhanced Weather Integration (Week 4)

### 4.1 Compact Weather Display
**File**: `components/tv-weather-compact.tsx`

**Bottom Panel Features**:
- [ ] **Current Conditions**: Large current temp + icon
- [ ] **Wind & Humidity**: Essential outdoor cooking data
- [ ] **Hourly Forecast**: Next 4-6 hours mini-forecast
- [ ] **Cooking Impact**: Weather-based cooking recommendations

**Data Enhancements**:
```typescript
interface WeatherCookingData extends WeatherData {
  cookingImpact: {
    windEffect: 'minimal' | 'moderate' | 'significant'
    humidityEffect: 'low' | 'normal' | 'high'
    recommendations: string[]
  }
}
```

### 4.2 Weather-Based Cooking Tips
**File**: `lib/weather-cooking.ts`

**Smart Recommendations**:
- [ ] Wind speed impact on grill temperature
- [ ] Humidity effects on cooking time
- [ ] Temperature adjustment suggestions
- [ ] Rain/weather alerts for outdoor cooking

---

## ⚡ Phase 5: Advanced Animations & Effects (Week 5)

### 5.1 CSS Animation Enhancement
**File**: `styles/tv-animations.css`

**Advanced Effects**:
```css
/* Flame particle effects */
.flame-particles::before {
  content: '';
  position: absolute;
  background: radial-gradient(circle, rgba(255,165,0,0.8) 0%, transparent 70%);
  animation: flame-flicker 2s ease-in-out infinite;
}

/* Heat shimmer effect */
.heat-shimmer {
  position: relative;
  overflow: hidden;
}

.heat-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shimmer 3s ease-in-out infinite;
}

/* Glow effects for hot elements */
.glow-hot {
  box-shadow: 0 0 20px rgba(255, 69, 0, 0.5);
  animation: glow-pulse 2s ease-in-out infinite alternate;
}
```

### 5.2 Real-time Visual Feedback
**File**: `lib/visual-feedback.ts`

**Dynamic Effects**:
- [ ] Temperature-based color gradients
- [ ] Heat visualization intensity
- [ ] Alert-triggered screen effects
- [ ] Progress completion celebrations

### 5.3 Background Video Enhancement
**File**: `components/enhanced-background-video.tsx`

**Improvements**:
- [ ] Multiple video sources for different cooking stages
- [ ] Dynamic opacity based on alert levels
- [ ] Particle overlay effects
- [ ] Performance optimization for TV displays

---

## 🔧 Phase 6: Data & Performance Optimization (Week 6)

### 6.1 Enhanced Data Management
**File**: `lib/tv-data-manager.ts`

**Optimizations**:
```typescript
interface TVDataManager {
  // Optimized polling for TV displays
  updateInterval: number    // 3 seconds for TV vs 5 for desktop
  
  // Smart caching for smooth animations
  temperatureBuffer: Map<number, number[]>
  
  // Predictive data loading
  preloadWeather: boolean
  prefetchAlerts: boolean
  
  // Performance monitoring
  performanceMetrics: {
    renderTime: number
    dataFetchTime: number
    animationFrameRate: number
  }
}
```

**Features**:
- [ ] Smart data polling intervals
- [ ] Temperature smoothing for cleaner animations
- [ ] Predictive loading for weather data
- [ ] Performance monitoring dashboard

### 6.2 Memory Management
**File**: `lib/memory-optimization.ts`

**TV-Specific Optimizations**:
- [ ] History data cleanup (keep only last 2 hours)
- [ ] Image preloading and caching
- [ ] Animation frame optimization
- [ ] Memory leak prevention

### 6.3 Node-RED Integration Enhancement
**File**: `lib/node-red-client.ts`

**Improved Integration**:
```typescript
interface EnhancedNodeRedClient {
  // Real-time WebSocket connection
  websocket: WebSocket | null
  
  // Fallback HTTP polling
  httpFallback: boolean
  
  // Data validation and transformation
  validateSensorData: (data: any) => Sensor[]
  
  // Connection health monitoring
  connectionHealth: {
    status: 'connected' | 'reconnecting' | 'failed'
    lastHeartbeat: Date
    reconnectAttempts: number
  }
}
```

---

## 🎨 Phase 7: Visual Polish & UX Refinement (Week 7)

### 7.1 Typography System
**File**: `styles/tv-typography.css`

**TV-Optimized Typography**:
```css
/* Large display temperatures */
.temp-display-xl {
  font-size: 4rem;        /* 64px */
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.02em;
}

/* Medium labels */
.label-tv {
  font-size: 1.125rem;    /* 18px */
  font-weight: 600;
  line-height: 1.4;
}

/* Status text */
.status-tv {
  font-size: 1rem;        /* 16px */
  font-weight: 500;
  line-height: 1.3;
}
```

### 7.2 Color System Enhancement
**File**: `styles/tv-colors.css`

**Temperature-Based Color Palette**:
```css
:root {
  /* Temperature colors */
  --temp-cold: oklch(0.7 0.15 240);      /* Cool blue */
  --temp-cool: oklch(0.75 0.12 180);     /* Light blue */
  --temp-warm: oklch(0.8 0.15 60);       /* Yellow */
  --temp-hot: oklch(0.7 0.2 30);         /* Orange */
  --temp-very-hot: oklch(0.65 0.25 15);  /* Red-orange */
  --temp-danger: oklch(0.6 0.3 0);       /* Red */
  
  /* Status colors */
  --status-ready: oklch(0.7 0.15 140);   /* Green */
  --status-warning: oklch(0.8 0.2 50);   /* Amber */
  --status-alert: oklch(0.65 0.25 15);   /* Red */
  
  /* Glow effects */
  --glow-warm: 0 0 20px var(--temp-warm);
  --glow-hot: 0 0 30px var(--temp-hot);
  --glow-alert: 0 0 40px var(--status-alert);
}
```

### 7.3 Accessibility for TV Viewing
**File**: `components/tv-accessibility.tsx`

**TV-Specific Accessibility**:
- [ ] High contrast mode for different lighting conditions
- [ ] Large focus indicators for remote navigation
- [ ] Audio feedback options
- [ ] Reduced motion preferences

---

## 🧪 Phase 8: Testing & Refinement (Week 8)

### 8.1 TV Simulator Testing
**File**: `components/tv-simulator.tsx`

**Testing Environment**:
```typescript
interface TVSimulator {
  screenSize: '55inch' | '65inch' | '75inch'
  resolution: '1920x1080' | '3840x2160'
  viewingDistance: '6ft' | '8ft' | '10ft' | '12ft'
  lightingCondition: 'bright' | 'normal' | 'dim'
  
  // Visual validation
  readabilityTest: boolean
  colorContrastTest: boolean
  animationSmoothness: boolean
}
```

### 8.2 Performance Testing
**File**: `__tests__/tv-performance.test.ts`

**Performance Benchmarks**:
- [ ] 60fps animation maintenance
- [ ] < 100ms data update response
- [ ] < 2GB memory usage after 24h operation
- [ ] Smooth rendering on 4K displays

### 8.3 Integration Testing
**File**: `__tests__/integration/tv-dashboard.test.ts`

**Test Scenarios**:
- [ ] Node-RED connection scenarios
- [ ] Session persistence across device switches
- [ ] Weather API fallback behavior
- [ ] Mock data generation consistency

---

## 📦 Phase 9: Deployment & Documentation (Week 9)

### 9.1 Environment Configuration
**File**: `config/tv-environment.ts`

**TV-Specific Config**:
```typescript
interface TVConfig {
  display: {
    enableHighRefreshRate: boolean
    optimizeFor4K: boolean
    enableHDREffects: boolean
  }
  
  data: {
    updateInterval: number
    cacheStrategy: 'aggressive' | 'balanced' | 'minimal'
    offlineMode: boolean
  }
  
  features: {
    enableParticleEffects: boolean
    enableAdvancedAnimations: boolean
    enableSoundFeedback: boolean
  }
}
```

### 9.2 Deployment Scripts
**File**: `scripts/deploy-tv.sh`

**TV Deployment**:
- [ ] Docker container optimization for TV hardware
- [ ] Environment variable configuration
- [ ] Health check endpoints
- [ ] Logging configuration for TV debugging

### 9.3 User Documentation
**File**: `docs/tv-setup-guide.md`

**Documentation Includes**:
- [ ] TV hardware requirements
- [ ] Network configuration guide
- [ ] Troubleshooting common issues
- [ ] Customization options

---

## 🎯 Success Metrics & Validation

### Visual Clarity Metrics
- [ ] **Temperature Readability**: Readable from 10+ feet
- [ ] **Status Recognition**: Instant status understanding
- [ ] **Color Differentiation**: Clear state distinctions
- [ ] **Animation Smoothness**: No lag or stuttering

### Performance Metrics
- [ ] **Load Time**: < 2 seconds initial load
- [ ] **Update Responsiveness**: < 500ms data updates
- [ ] **Memory Efficiency**: Stable over 24+ hours
- [ ] **Network Reliability**: Graceful offline handling

### User Experience Metrics
- [ ] **Information Hierarchy**: Most important data prominent
- [ ] **Alert Visibility**: Critical alerts immediately noticeable
- [ ] **Progression Tracking**: Clear cooking progress indication
- [ ] **Device Switching**: Seamless mobile ↔ TV transitions

---

## 🔄 Rollback & Migration Strategy

### Phased Rollout
1. **Development Environment**: Complete testing in dev
2. **Staging with TV Hardware**: Real hardware validation
3. **Feature Flag Deployment**: Gradual rollout with fallback
4. **Full Production**: Complete TV mode activation

### Fallback Options
- **Instant Fallback**: Revert to existing grill-monitor.tsx
- **Progressive Fallback**: Disable TV-specific features only
- **Device-Specific**: Fall back per device type

### Data Migration
- **Session Compatibility**: Ensure existing sessions work
- **Settings Preservation**: Maintain user preferences
- **History Retention**: Keep temperature history intact

---

## 📋 File Change Summary

### New Files to Create (25 files)
```
components/
├── tv-grill-monitor.tsx          # Main TV dashboard component
├── tv-meat-sensor-card.tsx       # Large TV-optimized meat cards
├── tv-status-bar.tsx             # Top information bar
├── tv-grill-panel.tsx            # Grill temperature panel
├── tv-live-highlights.tsx        # Enhanced highlights panel
├── tv-weather-compact.tsx        # Compact weather display
├── tv-meat-selector.tsx          # TV-friendly meat selector
├── enhanced-background-video.tsx # Enhanced video background
├── tv-accessibility.tsx          # TV accessibility features
├── tv-simulator.tsx              # Testing component
└── ui/
    └── tv-grid.tsx               # TV grid layout system

lib/
├── animations.ts                 # Animation utilities
├── tv-data-manager.ts           # TV-optimized data management
├── memory-optimization.ts        # Performance optimization
├── node-red-client.ts           # Enhanced Node-RED integration
├── visual-feedback.ts           # Dynamic visual effects
└── weather-cooking.ts           # Weather-based cooking tips

styles/
├── tv-animations.css            # TV-specific animations
├── tv-typography.css            # TV typography system
└── tv-colors.css               # TV color system

config/
└── tv-environment.ts           # TV configuration

scripts/
└── deploy-tv.sh               # TV deployment script

docs/
└── tv-setup-guide.md          # TV setup documentation

__tests__/
├── tv-performance.test.ts      # Performance testing
└── integration/
    └── tv-dashboard.test.ts    # Integration testing
```

### Files to Modify (8 files)
```
app/grill/page.tsx              # Add TV route logic
components/grill-monitor.tsx    # Add TV mode detection
lib/api.ts                     # Enhanced error handling
lib/dataStore.ts               # TV-optimized storage
app/globals.css                # TV-specific styles
package.json                   # Add TV-specific dependencies
next.config.ts                 # TV build optimization
docker-compose.yml             # TV deployment config
```

---

## 🚀 Implementation Priority

### Must-Have (MVP)
1. **Core Layout**: Basic Concept 1 layout structure
2. **Large Meat Cards**: TV-readable meat sensor displays
3. **Status Bar**: Essential session/weather/alert info
4. **Device Detection**: Automatic TV mode switching

### Should-Have (Enhanced)
1. **Advanced Animations**: Smooth temperature transitions
2. **Weather Integration**: Cooking-specific weather data
3. **Performance Optimization**: 60fps on TV hardware
4. **Enhanced Alerts**: Priority-based notification system

### Could-Have (Polish)
1. **Particle Effects**: Fire/smoke visual enhancements
2. **Sound Feedback**: Audio alert system
3. **4K Optimization**: Ultra-high resolution support
4. **Voice Control**: TV remote integration

---

This comprehensive plan maintains backward compatibility while creating a dramatic TV viewing experience. Each phase builds upon the previous, allowing for iterative testing and refinement. The existing Node-RED integration, session management, and weather systems remain intact while being enhanced for TV use.

**Estimated Timeline**: 9 weeks for complete implementation
**Resource Requirements**: 1 developer, access to TV hardware for testing
**Risk Mitigation**: Feature flags, progressive rollout, instant fallback capabilities
