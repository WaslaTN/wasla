# Wasla - Tunisia Transportation Management System

A modern, intelligent transportation management platform built with Next.js, designed to revolutionize how Tunisia moves. Wasla (وصلة) means "connection" in Arabic, representing our mission to connect people, places, and communities across Tunisia.

## 🌟 Features

- **🚌 Smart Booking System**: Real-time bus ticket booking and management
- **🗺️ Interactive Maps**: Visual route planning with Mapbox integration
- **🌐 Multilingual Support**: Arabic, French, and English interfaces
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile
- **🔐 User Authentication**: Secure login and profile management
- **📊 Real-time Tracking**: Live vehicle and route monitoring
- **🎫 Digital Tickets**: Paperless ticketing system
- **🏢 Station Partnership**: Network expansion through station partnerships

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wasla-frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Maps**: Mapbox GL JS
- **State Management**: React Hooks + Context
- **Authentication**: Custom JWT implementation
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 📁 Project Structure

```
wasla-frontend/
├── app/                    # Next.js App Router pages
│   ├── user/              # User dashboard and booking
│   ├── admin/             # Admin management
│   ├── supervisor/        # Station supervisor tools
│   └── station-partnership/ # Partnership requests
├── components/            # Reusable React components
├── lib/                   # Utilities and configurations
├── public/               # Static assets and logos
└── styles/               # Global CSS and themes
```

## 🌍 Multilingual Support

Wasla supports three languages:
- **العربية** (Arabic) - Primary language
- **Français** (French) - Secondary language  
- **English** - International language

Language switching is available throughout the application.

## 🎨 Branding

- **Name**: Wasla (وصلة)
- **Meaning**: "Connection" in Arabic
- **Mission**: Connecting Tunisia through intelligent transportation
- **Colors**: Orange (#f97316) and Red (#ef4444) gradients
- **Logo**: Modern, abstract "W" symbol representing connection

## 🚌 Transportation Network

Wasla integrates with Tunisia's traditional "Louage" (shared taxi) system, modernizing it with:
- Digital booking and payment
- Real-time vehicle tracking
- Route optimization
- Station management
- Driver tools and analytics

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint + Prettier for code formatting
- Component-based architecture
- Custom hooks for state management

## 📱 Mobile App

The Wasla desktop application (Tauri) provides station management tools for:
- Station operators
- Supervisors
- Administrative staff
- Driver management

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Contact the development team

---

**Built with ❤️ for Tunisia's transportation future**

*Wasla - Connecting Every Journey*