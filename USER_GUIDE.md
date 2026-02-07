# Social Media Agent - User Guide

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Features](#features)
  - [Dashboard](#dashboard)
  - [Calendar](#calendar)
  - [Analytics](#analytics)
  - [Workflow](#workflow)
  - [Tracking](#tracking)
  - [Metrics](#metrics)
  - [Approvals](#approvals)
  - [Tasks](#tasks)
  - [Logs](#logs)
  - [Settings](#settings)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Accessing the Dashboard
Visit: **https://lumi-core.github.io/social-dashboard/**

### First Time Setup
1. Navigate to **Settings** (⚙️ icon in sidebar)
2. Verify the API URL is set to your backend
3. Configure your preferences

---

## 📊 Dashboard Overview

The main dashboard provides a quick overview of your social media operations:

### Key Metrics
- **Total Posts**: All scheduled and published content
- **Success Rate**: Percentage of successfully published posts
- **Pending Approvals**: Posts awaiting your review
- **Active Workflows**: Currently running automated processes

### Recent Activity
- View the latest 5 posts with their status
- Quick access to content details
- Visual status indicators (Scheduled, Published, Pending, Failed)

### Quick Actions
- **New Post**: Create and schedule content manually
- **Run Workflow**: Trigger automated content generation
- **View Calendar**: See all scheduled posts

---

## 🎯 Features

### Dashboard
**Main Hub - Overview of All Activities**

#### What You See:
- Real-time statistics cards
- Recent posts table
- Quick action buttons
- System status indicators

#### How to Use:
1. Monitor key metrics at a glance
2. Click on any post to view details
3. Use quick actions for common tasks
4. Check status badges for post states

---

### Calendar
**Content Scheduling & Management**

#### Features:
- **Add New Content**: Schedule posts for specific dates
- **View Schedule**: See all upcoming and past content
- **Edit Posts**: Modify scheduled content
- **Delete Posts**: Remove unwanted entries
- **Filter by Date**: Find content for specific dates
- **Export to CSV**: Download your content calendar

#### Adding New Content:
1. Click **"+ Add New"** button
2. Fill in the form:
   - **Date**: When to post (YYYY-MM-DD)
   - **Platform**: Instagram, Facebook, TikTok, etc.
   - **Product**: Product name or ID
   - **Occasion**: Optional (holiday, event, campaign)
   - **Media URL**: Link to image/video
   - **Caption**: Your post text
3. Click **"Add to Calendar"**

#### Managing Content:
- **Edit**: Click edit icon (✏️) to modify
- **Delete**: Click delete icon (🗑️) to remove
- **Filter**: Use date filter to narrow results
- **Export**: Download CSV of all entries

#### Status Indicators:
- 🟢 **Published**: Successfully posted to social media
- 🟡 **Scheduled**: Waiting for scheduled time
- 🔵 **Pending**: Awaiting approval
- 🔴 **Failed**: Error occurred during posting

---

### Analytics
**Performance Insights & Metrics**

#### Overview Tab:
- **Engagement Rate**: Average user interaction
- **Content Performance**: Success/failure rates
- **Platform Distribution**: Posts across platforms
- **Trend Analysis**: Performance over time

#### Charts & Graphs:
1. **Performance Over Time**: Line chart showing daily metrics
2. **Platform Breakdown**: Distribution pie chart
3. **Top Performing Posts**: Best content by engagement
4. **Recent Analytics**: Latest performance data

#### Using Analytics:
1. Select date range (7, 30, 90 days)
2. Filter by platform
3. Export data for external analysis
4. Refresh for latest data

---

### Workflow
**Automated Content Generation**

#### Run Daily Workflow:
1. Click **"Run Daily Workflow"** button
2. System automatically:
   - Researches trending topics
   - Generates AI content
   - Processes media
   - Sends for approval

#### Manual Workflow by Date:
1. Enter specific date (YYYY-MM-DD)
2. Click **"Run by Date"**
3. Workflow generates content for that date

#### Manual Workflow by Entry:
1. Enter calendar entry ID
2. Click **"Run by ID"**
3. Process specific calendar entry

#### Check Workflow Status:
- View current workflow state
- See execution progress
- Monitor for errors
- View completion status

---

### Tracking
**Media Upload & Asset Management**

#### Upload Media:
1. Click **"Upload Media"** or drag & drop files
2. Supported formats:
   - Images: JPG, PNG, GIF
   - Videos: MP4, MOV
3. View upload progress
4. Uploaded media appears in table

#### Manage Media:
- **View All**: See all uploaded media
- **Filter**: Search by filename or type
- **Preview**: Click to view media
- **Copy URL**: Use in calendar entries
- **Delete**: Remove unused media

#### Media Table Columns:
- **Thumbnail**: Visual preview
- **Filename**: Asset name
- **Type**: Image or Video
- **Upload Date**: When uploaded
- **URL**: Direct link to media
- **Actions**: Copy/Delete options

---

### Metrics
**Detailed Performance Analytics**

#### Key Metrics:
- **Total Impressions**: How many times content was seen
- **Total Engagement**: Likes, comments, shares combined
- **Total Reach**: Unique users who saw content
- **Average Engagement Rate**: Average interaction percentage

#### View Options:
1. **By Platform**: Compare Instagram, Facebook, TikTok
2. **By Date Range**: Weekly, monthly, quarterly
3. **By Content Type**: Image vs video performance
4. **Export Data**: Download for reports

#### Engagement Breakdown:
- Likes counter
- Comments counter
- Shares/saves counter
- Click-through rate

---

### Approvals
**Review & Approve AI-Generated Content**

#### Approval Queue:
View all posts awaiting your approval with:
- Generated caption
- Media preview
- Platform destination
- Scheduled date/time

#### Approval Actions:

**1. Approve ✅**
- Content posts immediately or at scheduled time
- Moves to "Published" status
- No further action needed

**2. Reject ❌**
- Provide feedback on why rejected
- Content removed from queue
- Can regenerate new content

**3. Revise 🔄**
- Provide specific revision instructions
- AI regenerates improved version
- New version sent for approval
- Original content saved

#### Best Practices:
- Review captions for brand voice
- Check media quality and relevance
- Verify hashtags and mentions
- Ensure compliance with platform guidelines
- Provide specific feedback for revisions

---

### Tasks
**Agent Activity Monitor**

#### What You See:
- Active AI agent tasks
- Workflow execution status
- Task progress indicators
- Completion timestamps

#### Task Types:
- **Content Generation**: AI creating captions
- **Media Processing**: Image/video optimization
- **Trend Research**: Finding trending topics
- **Post Evaluation**: Quality checks
- **Publishing**: Posting to platforms

#### Status Indicators:
- ⏳ **Running**: Task in progress
- ✅ **Completed**: Task finished successfully
- ❌ **Failed**: Task encountered error
- ⏸️ **Paused**: Task temporarily stopped

---

### Logs
**System Activity & Error Tracking**

#### Log Types:
- **Info**: General system activities
- **Warning**: Potential issues detected
- **Error**: Failed operations
- **Success**: Completed operations

#### Viewing Logs:
1. Filter by level (All, Info, Warning, Error)
2. Search by keyword or date
3. View detailed error messages
4. Export logs for troubleshooting

#### Common Log Entries:
- Workflow started/completed
- Post published successfully
- API errors
- Configuration changes
- User actions

---

### Settings
**Configuration & Preferences**

#### API Configuration:
- **API Base URL**: Your backend server
- **API Key**: Authentication (if required)
- **Test Connection**: Verify API is reachable

#### Display Preferences:
- **Theme**: Light/Dark mode
- **Date Format**: Customize date display
- **Timezone**: Set your local timezone

#### Notification Settings:
- Enable/disable email notifications
- Configure approval alerts
- Set error notifications

#### Export/Import:
- Export settings to file
- Import previous configuration
- Reset to defaults

---

## 💡 Common Tasks

### Creating a Social Media Post

**Method 1: Manual Entry**
1. Go to **Calendar**
2. Click **"+ Add New"**
3. Fill in all required fields
4. Click **"Add to Calendar"**
5. Post appears as "Scheduled"

**Method 2: AI Generation**
1. Go to **Workflow**
2. Click **"Run Daily Workflow"**
3. AI generates content automatically
4. Go to **Approvals** to review
5. Approve/Revise/Reject as needed

---

### Approving AI-Generated Content

1. Navigate to **Approvals** section
2. Review pending post details:
   - Caption quality
   - Media appropriateness
   - Hashtags and mentions
   - Scheduled timing
3. Choose action:
   - **Approve**: Content posts automatically
   - **Revise**: Provide feedback for regeneration
   - **Reject**: Remove from queue

---

### Uploading Media

1. Go to **Tracking** section
2. Click **"Upload Media"** or drag files
3. Wait for upload completion
4. Copy media URL
5. Use URL in calendar entries

---

### Viewing Analytics

1. Navigate to **Analytics**
2. Select date range
3. Choose platform filter (optional)
4. View charts and metrics
5. Export data if needed

---

### Checking Workflow Status

1. Go to **Workflow** section
2. Click **"Check Status"**
3. View current state:
   - Idle: No active workflow
   - Running: Processing content
   - Completed: Finished successfully
   - Failed: Check logs for errors

---

### Exporting Data

**Calendar Export:**
1. Go to Calendar
2. Click **"Export to CSV"**
3. File downloads automatically

**Analytics Export:**
1. Go to Analytics
2. Select date range
3. Click export icon
4. Choose format (CSV/JSON)

**Logs Export:**
1. Go to Logs
2. Filter logs as needed
3. Click **"Export Logs"**
4. Save for troubleshooting

---

## 🔧 Troubleshooting

### Dashboard Not Loading
**Issue**: White screen or loading forever

**Solutions**:
1. Check internet connection
2. Clear browser cache:
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
3. Try different browser
4. Verify API URL in Settings

---

### API Connection Failed
**Issue**: "Failed to fetch" or "Network error"

**Solutions**:
1. Go to **Settings**
2. Verify API Base URL is correct
3. Click **"Test Connection"**
4. Check if backend server is running
5. Verify CORS is enabled on backend
6. Check firewall/network restrictions

---

### Content Not Appearing
**Issue**: Added content doesn't show in calendar

**Solutions**:
1. Refresh the page (F5)
2. Check date filter isn't excluding it
3. Verify API connection in Settings
4. Check browser console for errors (F12)

---

### Upload Failed
**Issue**: Media upload doesn't complete

**Solutions**:
1. Check file size (max 10MB recommended)
2. Verify file format (JPG, PNG, MP4, MOV)
3. Check internet connection stability
4. Try smaller file or different format
5. Check backend storage configuration

---

### Approval Action Not Working
**Issue**: Approve/Reject button doesn't respond

**Solutions**:
1. Refresh the page
2. Check API connection
3. View logs for error messages
4. Verify backend is processing approvals
5. Check browser console (F12)

---

### Workflow Stuck
**Issue**: Workflow shows "Running" for too long

**Solutions**:
1. Check **Logs** for errors
2. Go to **Tasks** to see specific issue
3. Refresh workflow status
4. Contact administrator if stuck >5 minutes

---

### Analytics Not Updating
**Issue**: Old data or no data showing

**Solutions**:
1. Click refresh button
2. Verify posts are actually published
3. Check if Instagram/Facebook API is connected
4. Allow time for data to sync (can take 1-24 hours)
5. Verify metrics tracking is enabled

---

### Session Expired
**Issue**: "Unauthorized" or "Session expired" messages

**Solutions**:
1. Refresh the page (F5)
2. Clear browser storage:
   - Open Console (F12)
   - Application tab → Storage → Clear
3. Re-enter API credentials in Settings

---

## 📞 Support & Resources

### Getting Help
- **Documentation**: This guide
- **Logs**: Check for detailed error messages
- **Settings**: Test API connection
- **Browser Console**: View technical errors (F12)

### Best Practices
- ✅ Regular backups via CSV export
- ✅ Review AI content before publishing
- ✅ Monitor logs for recurring issues
- ✅ Keep API URL and credentials secure
- ✅ Test changes in off-peak hours
- ✅ Provide specific feedback for AI revisions

### Keyboard Shortcuts
- **Refresh Data**: `Ctrl + R` or `F5`
- **Open Console**: `F12`
- **Settings**: Click ⚙️ in sidebar
- **Search**: Use browser search `Ctrl + F`

---

## 🎓 Tips & Tricks

1. **Use CSV Export**: Regular backups help track historical content
2. **Revise vs Reject**: Use "Revise" to improve content, "Reject" only if completely unusable
3. **Organize Media**: Name files descriptively before uploading
4. **Monitor Metrics**: Weekly reviews help optimize content strategy
5. **Filter Logs**: Use log filters to quickly find specific events
6. **Test Workflows**: Run small test workflows before scaling
7. **Approval Feedback**: Be specific in revision requests for better results

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Platform**: Social Media Agent Dashboard
