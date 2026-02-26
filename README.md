# Social Media Agent Dashboard

A professional, modern web dashboard for managing and monitoring the Social Media Agent system.

## 🚀 Quick Start

### Option 1: Python HTTP Server (Recommended)
```bash
cd dashboard
python serve.py
```
This will start a local server at `http://localhost:3000` and automatically open your browser.

### Option 2: Open Directly
Simply open `index.html` in your web browser. Note: Some features may be limited due to CORS restrictions.

### Option 3: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"

## 📁 Project Structure

```
dashboard/
├── index.html          # Main HTML file
├── serve.py            # Python development server
├── README.md           # This file
├── css/
│   └── styles.css      # All CSS styles
├── js/
│   ├── api.js          # API service module
│   ├── utils.js        # Utility functions
│   ├── app.js          # Main application
│   ├── dashboard.js    # Dashboard page
│   ├── calendar.js     # Calendar page
│   ├── workflow.js     # Workflow page
│   ├── tracking.js     # Tracking page
│   ├── metrics.js      # Metrics page
│   ├── approvals.js    # Approvals page
│   ├── tasks.js        # Tasks page
│   ├── logs.js         # Logs page
│   └── settings.js     # Settings page
└── assets/
    └── (icons, images)
```

## 🎯 Features

### Dashboard
- System health overview
- Quick statistics (scheduled posts, published, pending approvals)
- Scheduler status and controls
- Quick action buttons

### Content Calendar
- View all scheduled posts
- Filter by status (All, Pending, Scheduled, Posted, Failed)
- Filter by date
- Add single or bulk posts
- Start workflow for individual posts
- Delete entries

### Workflow Management
- Start new workflows with custom parameters
- Run daily workflow
- Run workflow by specific date
- Run workflow by entry ID
- Check workflow status by session ID

### Post Tracking
- View all published posts
- Track Instagram media IDs
- Export data to CSV

### Instagram Metrics
- Overview cards with totals (views, reach, likes, comments, shares, saved)
- Detailed per-post metrics table
- Manual refresh from Instagram API

### Approvals
- View pending approval requests
- Approve posts
- Reject posts with feedback
- Request revisions

### Agent Tasks
- View active and completed tasks
- Task status tracking
- Duration calculation

### Error Logs
- View system errors
- Error severity levels
- Timestamps

### Settings
- Configure API base URL
- Set API key
- View current server configuration
- Scheduler controls
- System information

## 🔧 Configuration

### API Connection
The dashboard connects to the Social Media Agent API. By default, it uses:
```
https://social-media-agent-production-e6df.up.railway.app
```

To change this:
1. Go to **Settings** page
2. Enter your API Base URL
3. Enter your API Key (if required)
4. Click **Save Settings**

Settings are stored in localStorage and persist across sessions.

## 🎨 Design Features

- **Modern UI**: Clean, professional design with smooth animations
- **Responsive**: Works on desktop, tablet, and mobile
- **Dark Sidebar**: Easy navigation with active state indicators
- **Toast Notifications**: Non-intrusive feedback for all actions
- **Loading States**: Visual feedback during API calls
- **Modals**: Clean dialogs for forms and confirmations
- **Status Badges**: Color-coded status indicators

## 🛠️ Development

### Modifying Styles
All styles are in `css/styles.css`. The file uses CSS custom properties (variables) for easy theming:
```css
:root {
    --primary: #6366f1;
    --success: #22c55e;
    --warning: #f59e0b;
    --danger: #ef4444;
    /* ... */
}
```

### Adding New Features
1. Create a new module in `js/` directory
2. Add the page section in `index.html`
3. Add navigation item in the sidebar
4. Initialize in `app.js`

### API Integration
All API calls go through `js/api.js`. To add a new endpoint:
```javascript
// In api.js
async myNewEndpoint(data) {
    return this.post('/api/my-endpoint', data);
}

// Usage
const result = await api.myNewEndpoint({ foo: 'bar' });
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🔒 Security Notes

- API keys are stored in localStorage (client-side only)
- No sensitive data is hardcoded
- CORS headers are required on the API server
- Use HTTPS in production

## 📄 License

Part of the Social Media Agent project.
