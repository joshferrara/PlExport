# PlExport

A lightweight web application that allows you to export your Plex media libraries to CSV or JSON format.

## Features

- 🔐 **Plex Authentication** - Secure PIN-based OAuth login with your Plex account
- 📚 **Library Browsing** - Access all your Plex libraries (Movies, TV Shows, Music, Photos)
- 🎯 **Smart Filtering** - Filter by collections and search for specific items
- ✅ **Multi-Select** - Select individual items or use "Select All" for bulk operations
- 📥 **Export Formats** - Export to CSV or JSON with library-specific metadata
- 🎨 **Clean UI** - Modern, responsive interface that works on all devices

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Plex Web API** - Official Plex API integration
- **PapaParse** - CSV generation
- **Jose** - JWT session management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Plex account with access to a Plex server
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd plexport
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
# Plex API Configuration
NEXT_PUBLIC_PLEX_PRODUCT=PlExport
NEXT_PUBLIC_PLEX_CLIENT_IDENTIFIER=plexport-unique-id-here

# Session Secret (generate a secure random string)
SESSION_SECRET=your-secure-secret-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Login** - Click "Sign in with Plex" and authorize the application
2. **Select Library** - Choose which library you want to export from
3. **Filter (Optional)** - Select a collection or use the search bar to filter items
4. **Select Items** - Check individual items or use "Select All"
5. **Export** - Choose CSV or JSON format and download your export

## Export Data Fields

### Movies
- Title, Year, Studio, Content Rating, Rating
- Duration (minutes), Summary, Genres
- Directors, Actors, Added Date

### TV Shows
- Title, Year, Studio, Content Rating, Rating
- Number of Seasons, Number of Episodes
- Summary, Genres, Added Date

### Music Artists
- Artist Name, Summary, Genres
- Country, Added Date

### Music Albums
- Album Title, Artist, Year, Studio
- Rating, Genres, Added Date

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_PLEX_PRODUCT`
   - `NEXT_PUBLIC_PLEX_CLIENT_IDENTIFIER`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted with Docker

## Security Notes

- Sessions are stored in HTTP-only cookies using JWT
- Authentication tokens are never exposed to the client
- All API routes require valid authentication
- Session secret should be a strong, random string in production

## Troubleshooting

### Authentication Issues
- Ensure your client identifier is unique
- Check that the auth popup isn't blocked by your browser
- Verify your Plex account has access to a server

### Export Problems
- Make sure items are selected before exporting
- Check browser console for detailed error messages
- Verify your server is accessible

### Connection Issues
- Ensure your Plex server is running and accessible
- Check firewall settings if running locally
- Verify network connectivity to Plex services

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project however you'd like!

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Plex](https://www.plex.tv)
- Styled with [Tailwind CSS](https://tailwindcss.com)
