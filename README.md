# Creative - Collaborative Workspace

A modern collaborative workspace for creative teams with AI assistance, cloud storage, team chat, and video calling capabilities.

## 🚀 Features

- **Personal Dashboard** - Weather, music player, task management, and calendar
- **AI Assistant** - Powered by Grok-3 for writing help, coding assistance, and more
- **Cloud Storage** - File management and sharing
- **Team Chat** - Real-time messaging and collaboration
- **Video Calling** - High-quality video conferencing
- **Premium Features** - Advanced capabilities for premium users
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## 🎨 UI Improvements

### Design System Integration
- ✅ Consistent use of design system colors and tokens
- ✅ Proper dark/light mode support with ThemeProvider
- ✅ Responsive design with mobile-first approach
- ✅ Improved accessibility with ARIA labels and keyboard navigation

### Component Enhancements
- ✅ **Personal Dashboard**: Mobile-responsive layout with collapsible navigation
- ✅ **Authentication Forms**: Consistent styling with design system
- ✅ **AI Chat**: Improved message bubbles and interaction design
- ✅ **Navigation**: Mobile-friendly sidebar navigation
- ✅ **Cards**: Consistent backdrop blur and border styling

### Technical Fixes
- ✅ Fixed React 19 compatibility issues
- ✅ Updated dependencies to stable versions
- ✅ Improved TypeScript type safety
- ✅ Enhanced performance with proper memoization

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion
- **Authentication**: Supabase Auth
- **AI**: Grok-3 via xAI
- **Database**: Supabase PostgreSQL
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd creative-workspace
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Key UI Features

### Responsive Design
- Mobile-first approach with breakpoint-specific layouts
- Collapsible navigation for mobile devices
- Touch-friendly interface elements

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast color schemes
- Focus management

### Performance
- Optimized animations with Framer Motion
- Lazy loading for components
- Efficient state management
- Minimal bundle size

## 🎨 Design System

The application uses a comprehensive design system with:

- **Colors**: Semantic color tokens for light/dark modes
- **Typography**: Consistent font hierarchy and spacing
- **Spacing**: 4px base unit system
- **Components**: Reusable UI components with variants
- **Animations**: Smooth transitions and micro-interactions

## 📱 Mobile Experience

- Responsive grid layouts
- Touch-optimized interactions
- Mobile navigation drawer
- Optimized form inputs
- Gesture-friendly controls

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.