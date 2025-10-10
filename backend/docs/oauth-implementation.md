# OAuth 2.0 Implementation Guide

## Overview

The OAuth 2.0 implementation provides secure authentication for services like Gmail, Google Sheets, Epic FHIR, Slack, and other third-party platforms. This guide covers both the technical implementation and how to configure OAuth for your services.

## Architecture

### Backend Components

1. **OAuth Provider** (`oauth2_provider.py`)
   - Handles OAuth authorization flow
   - Token exchange and refresh
   - Credential testing

2. **OAuth Controller** (`oauth_controller.py`)
   - Manages OAuth state for CSRF protection
   - Initiates authorization flow
   - Handles callbacks from OAuth providers

3. **OAuth Routes** (`oauth_routes.py`)
   - `POST /oauth/initiate` - Start OAuth flow
   - `GET /oauth/callback` - Handle provider callback
   - `GET /oauth/status` - Check OAuth state (debugging)

### Frontend Components

1. **OAuth API Client** (`oauth.ts`)
   - `initiateOAuth()` - Start flow
   - `openOAuthPopup()` - Open authorization in popup
   - `completeOAuthFlow()` - Complete end-to-end flow

2. **OAuth Callback Page** (`/dashboard/connections/oauth/callback/page.tsx`)
   - Receives OAuth redirect
   - Forwards to backend callback
   - Displays status to user

3. **AddConnectionModal** Integration
   - Detects OAuth services
   - Triggers popup flow
   - Handles success/failure

## Flow Diagram

```
User clicks "Add Connection"
  ↓
Selects OAuth service (e.g., Gmail)
  ↓
Frontend calls POST /oauth/initiate
  ← Backend generates state, returns auth URL
  ↓
Frontend opens popup with auth URL
  ↓
User authorizes on provider's site
  ↓
Provider redirects to /oauth/callback
  ↓
Backend exchanges code for tokens
  ↓
Backend creates encrypted connection
  ↓
Backend returns HTML with postMessage
  ↓
Popup sends message to opener
  ↓
Popup auto-closes
  ↓
Main window refreshes connections list
```

## Security Features

### State Parameter (CSRF Protection)
- Cryptographically random 32-byte token
- Stored with user context
- Validated on callback
- Expires after 10 minutes
- Prevents CSRF attacks

### Credential Encryption
- Fernet symmetric encryption
- PBKDF2HMAC key derivation
- Access tokens encrypted at rest
- Refresh tokens encrypted at rest

### Token Refresh
- Automatic refresh on expiration
- Stored refresh tokens
- Transparent to user

## Configuration

### Setting Up OAuth for a Service

#### 1. Create OAuth App

**For Gmail/Google Sheets:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API / Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   - `http://localhost:8000/oauth/callback` (development)
   - `https://yourdomain.com/oauth/callback` (production)
7. Copy Client ID and Client Secret

**For Epic FHIR:**
1. Register at [Epic Fuse](https://fuse.epic.com/)
2. Create a new app
3. Request production access
4. Configure redirect URI
5. Get Client ID and Client Secret

#### 2. Configure Environment Variables

Add to `/backend/.env`:

```env
# Gmail OAuth
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret

# Google Sheets OAuth
GOOGLE_SHEETS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_SHEETS_CLIENT_SECRET=your-client-secret

# Epic FHIR OAuth
EPIC_CLIENT_ID=your-epic-client-id
EPIC_CLIENT_SECRET=your-epic-client-secret
```

#### 3. Update Service Definition

The service is already configured in `service_definitions.py`:

```python
"gmail": {
    "display_name": "Gmail",
    "description": "Send and receive emails via Gmail",
    "category": ServiceCategory.COMMUNICATION,
    "auth_type": "oauth2",
    "auth_config": {
        "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_endpoint": "https://oauth2.googleapis.com/token",
        "scopes": ["https://www.googleapis.com/auth/gmail.send"],
    },
    "test_endpoint": "https://gmail.googleapis.com/gmail/v1/users/me/profile",
},
```

#### 4. Restart Backend

```bash
cd backend
.venv/bin/python -m uvicorn src.app.main:app --reload --port 8000
```

## Usage

### From the UI

1. Navigate to **Dashboard → Connections**
2. Click **"Add Connection"**
3. Search for service (e.g., "Gmail")
4. Click on the service card
5. Enter a display name
6. Click **"Create Connection"**
7. **Popup opens** with provider's authorization page
8. Authorize the application
9. **Popup closes automatically**
10. Connection appears in list with "Active" status

### Programmatically

```typescript
import { completeOAuthFlow } from "@/lib/api";

const result = await completeOAuthFlow({
  service_type: "gmail",
  user_id: "user-123",
  display_name: "My Gmail Account",
});

if (result.success) {
  console.log("Connection ID:", result.connection_id);
} else {
  console.error("Error:", result.error);
}
```

## API Reference

### POST /oauth/initiate

Initiates OAuth 2.0 authorization flow.

**Request:**
```json
{
  "service_type": "gmail",
  "user_id": "user-123",
  "display_name": "My Gmail",
  "redirect_uri": "http://localhost:3000/dashboard/connections/oauth/callback"
}
```

**Response (Success):**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "abc123...",
  "client_id": "your-client-id.apps.googleusercontent.com"
}
```

**Response (Missing Config):**
```json
{
  "error": "Missing GMAIL_CLIENT_ID environment variable",
  "requires_setup": true
}
```

### GET /oauth/callback

Handles OAuth callback from authorization server.

**Query Parameters:**
- `code` - Authorization code
- `state` - State parameter (CSRF protection)
- `redirect_uri` - Original redirect URI

**Response:**
HTML page that:
1. Displays success/error message
2. Sends postMessage to opener window
3. Auto-closes after 2-3 seconds

### GET /oauth/status

Check OAuth state status (debugging).

**Query Parameters:**
- `state` (optional) - Specific state to check

**Response:**
```json
{
  "active_states": 0,
  "states": []
}
```

## Troubleshooting

### "Failed to open popup"
- **Cause**: Browser blocking popups
- **Solution**: Allow popups for your site in browser settings

### "Invalid or expired state parameter"
- **Cause**: OAuth state expired (>10 minutes) or already used
- **Solution**: Start flow again

### "Missing CLIENT_ID environment variable"
- **Cause**: OAuth credentials not configured
- **Solution**: Set environment variables and restart backend

### "Failed to validate credentials"
- **Cause**: Test endpoint returned error
- **Solution**: Check service API permissions and credentials

### Popup doesn't close automatically
- **Cause**: postMessage not received
- **Solution**: Check browser console for errors, verify origins match

## Production Considerations

### Environment Variables
- Use secrets manager (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit credentials to version control
- Rotate client secrets regularly

### Redirect URIs
- Use HTTPS in production
- Configure multiple redirect URIs for different environments
- Whitelist specific domains

### State Management
- Use Redis or database instead of in-memory dict
- Implement cleanup job for expired states
- Consider using JWT for state parameter

### Error Handling
- Log OAuth errors for debugging
- Provide user-friendly error messages
- Implement retry logic for token refresh

### Token Storage
- Encrypt tokens before database storage (already implemented)
- Set appropriate database permissions
- Consider token rotation policies

## Testing

### Manual Testing

1. **Test OAuth Initiation:**
```bash
curl -X POST http://localhost:8000/oauth/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "service_type": "gmail",
    "user_id": "test-user",
    "display_name": "Test Gmail"
  }'
```

2. **Check OAuth States:**
```bash
curl http://localhost:8000/oauth/status
```

3. **Test Service Discovery:**
```bash
curl http://localhost:8000/services/gmail
```

### Integration Testing

```typescript
// Test complete OAuth flow
describe("OAuth Flow", () => {
  it("should complete Gmail OAuth", async () => {
    const result = await completeOAuthFlow({
      service_type: "gmail",
      user_id: "test-user",
      display_name: "Test Connection",
    });

    expect(result.success).toBe(true);
    expect(result.connection_id).toBeDefined();
  });
});
```

## Adding New OAuth Services

1. **Add service definition** to `service_definitions.py`
2. **Configure OAuth endpoints** (authorization, token, test)
3. **Add scopes** required by the service
4. **Set environment variables** for client credentials
5. **Test** the complete flow
6. **Document** any service-specific requirements

Example:

```python
"slack": {
    "display_name": "Slack",
    "description": "Post messages to Slack channels",
    "category": ServiceCategory.COMMUNICATION,
    "auth_type": "oauth2",
    "auth_config": {
        "authorization_endpoint": "https://slack.com/oauth/v2/authorize",
        "token_endpoint": "https://slack.com/api/oauth.v2.access",
        "scopes": ["chat:write", "channels:read"],
    },
    "test_endpoint": "https://slack.com/api/auth.test",
},
```

## Support

For issues or questions:
1. Check logs in `/tmp/backend.log`
2. Verify environment variables are set
3. Check browser console for frontend errors
4. Review OAuth provider documentation
5. Contact development team
