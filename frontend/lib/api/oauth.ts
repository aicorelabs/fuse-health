import { request, RequestOptions } from "./endpoints";

/**
 * OAuth flow API client
 */

export interface InitiateOAuthRequest {
    service_type: string;
    user_id: string;
    display_name: string;
    redirect_uri?: string;
}

export interface InitiateOAuthResponse {
    authorization_url?: string;
    state?: string;
    client_id?: string;
    error?: string;
    requires_setup?: boolean;
}

export interface OAuthCallbackResult {
    success: boolean;
    connection_id?: string;
    message?: string;
    error?: string;
}

/**
 * Initiate OAuth 2.0 authorization flow
 * Returns the authorization URL to redirect the user to
 */
export function initiateOAuth(payload: InitiateOAuthRequest, options?: RequestOptions) {
    return request<InitiateOAuthResponse>(
        "/oauth/initiate",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                redirect_uri: payload.redirect_uri || `${window.location.origin}/dashboard/connections/oauth/callback`,
            }),
        },
        options
    );
}

/**
 * Open OAuth authorization in a popup window
 * Returns a promise that resolves when the OAuth flow completes
 */
export function openOAuthPopup(authUrl: string): Promise<OAuthCallbackResult> {
    return new Promise((resolve, reject) => {
        // Open popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            authUrl,
            "OAuth Authorization",
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
        );

        if (!popup) {
            reject(new Error("Failed to open popup. Please allow popups for this site."));
            return;
        }

        // Listen for messages from the popup
        const handleMessage = (event: MessageEvent) => {
            // Security: verify origin if needed
            // if (event.origin !== window.location.origin) return;

            if (event.data.type === "oauth-success") {
                window.removeEventListener("message", handleMessage);
                resolve({
                    success: true,
                    connection_id: event.data.connectionId,
                    message: event.data.message,
                });
            } else if (event.data.type === "oauth-error") {
                window.removeEventListener("message", handleMessage);
                resolve({
                    success: false,
                    error: event.data.error,
                });
            }
        };

        window.addEventListener("message", handleMessage);

        // Check if popup was closed without completing
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener("message", handleMessage);
                reject(new Error("OAuth flow was cancelled"));
            }
        }, 500);

        // Cleanup after 5 minutes
        setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            if (!popup.closed) {
                popup.close();
            }
            reject(new Error("OAuth flow timed out"));
        }, 5 * 60 * 1000);
    });
}

/**
 * Complete OAuth flow with initiation and popup handling
 */
export async function completeOAuthFlow(request: InitiateOAuthRequest): Promise<OAuthCallbackResult> {
    // Step 1: Initiate OAuth and get authorization URL
    const initResponse = await initiateOAuth(request);

    if (initResponse.error || !initResponse.authorization_url) {
        return {
            success: false,
            error: initResponse.error || "Failed to initiate OAuth flow",
        };
    }

    // Step 2: Open popup and wait for completion
    try {
        const result = await openOAuthPopup(initResponse.authorization_url);
        return result;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "OAuth flow failed",
        };
    }
}
