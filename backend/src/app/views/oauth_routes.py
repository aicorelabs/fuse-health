"""OAuth flow API routes."""
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from ..controllers.oauth_controller import (
    initiate_oauth,
    handle_oauth_callback,
    get_oauth_status,
)


router = APIRouter(prefix="/oauth", tags=["oauth"])


class InitiateOAuthRequest(BaseModel):
    """Request to initiate OAuth flow."""

    service_type: str
    user_id: str
    display_name: str
    redirect_uri: str = "http://localhost:3000/dashboard/connections/oauth/callback"


class InitiateOAuthResponse(BaseModel):
    """Response from initiating OAuth flow."""

    authorization_url: str | None = None
    state: str | None = None
    client_id: str | None = None
    error: str | None = None
    requires_setup: bool | None = None


@router.post("/initiate", response_model=InitiateOAuthResponse)
async def initiate_oauth_flow(request: InitiateOAuthRequest):
    """
    Initiate OAuth 2.0 authorization flow.

    Returns the authorization URL that the user should be redirected to.
    """
    result = await initiate_oauth(
        service_type=request.service_type,
        user_id=request.user_id,
        display_name=request.display_name,
        redirect_uri=request.redirect_uri,
    )

    return result


@router.get("/callback")
async def oauth_callback(
    code: str = Query(...,
                      description="Authorization code from OAuth provider"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    redirect_uri: str = Query(
        default="http://localhost:8000/oauth/callback",
        description="Redirect URI used in initial request",
    ),
):
    """
    Handle OAuth callback from the authorization server.

    This endpoint is called by the OAuth provider after user authorization.
    It exchanges the code for tokens and creates a connection.
    """
    result = await handle_oauth_callback(
        code=code,
        state=state,
        redirect_uri=redirect_uri,
    )

    # Return HTML that communicates with the popup opener
    if result["success"]:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Success</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 2rem;
                }}
                .icon {{
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }}
                h1 {{
                    margin: 0 0 0.5rem 0;
                    font-size: 2rem;
                }}
                p {{
                    margin: 0;
                    opacity: 0.9;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">✓</div>
                <h1>Connection Successful!</h1>
                <p>{result['message']}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">You can close this window.</p>
            </div>
            <script>
                // Send success message to opener window
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'oauth-success',
                        connectionId: '{result['connection_id']}',
                        message: '{result['message']}'
                    }}, '*');
                    
                    // Close window after 2 seconds
                    setTimeout(() => window.close(), 2000);
                }}
            </script>
        </body>
        </html>
        """
    else:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>OAuth Error</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 2rem;
                }}
                .icon {{
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }}
                h1 {{
                    margin: 0 0 0.5rem 0;
                    font-size: 2rem;
                }}
                p {{
                    margin: 0;
                    opacity: 0.9;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">✗</div>
                <h1>Connection Failed</h1>
                <p>{result.get('error', 'Unknown error occurred')}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">Please try again.</p>
            </div>
            <script>
                // Send error message to opener window
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'oauth-error',
                        error: '{result.get('error', 'Unknown error')}'
                    }}, '*');
                    
                    // Close window after 3 seconds
                    setTimeout(() => window.close(), 3000);
                }}
            </script>
        </body>
        </html>
        """

    return HTMLResponse(content=html_content)


@router.get("/status")
async def check_oauth_status(state: str | None = None):
    """
    Check OAuth state status (for debugging).

    If state is provided, checks that specific state.
    Otherwise, returns count of active states.
    """
    return await get_oauth_status(state)
