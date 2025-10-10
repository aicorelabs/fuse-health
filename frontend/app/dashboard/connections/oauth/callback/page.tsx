"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">(
        "processing",
    );
    const [message, setMessage] = useState("");

    useEffect(() => {
        const code = searchParams?.get("code");
        const state = searchParams?.get("state");
        const error = searchParams?.get("error");

        if (error) {
            setStatus("error");
            setMessage(`OAuth error: ${error}`);

            // Send error to parent
            if (window.opener) {
                window.opener.postMessage({
                    type: "oauth-error",
                    error: error,
                }, "*");
                setTimeout(() => window.close(), 3000);
            }
            return;
        }

        if (!code || !state) {
            setStatus("error");
            setMessage("Missing OAuth parameters");
            return;
        }

        // The backend will handle the actual callback
        // This page is just for showing status while that happens
        setStatus("processing");
        setMessage("Completing authorization...");

        // Redirect to backend callback endpoint
        const backendUrl = `http://localhost:8000/oauth/callback?code=${
            encodeURIComponent(code)
        }&state=${encodeURIComponent(state)}&redirect_uri=${
            encodeURIComponent(
                window.location.origin +
                    "/dashboard/connections/oauth/callback",
            )
        }`;
        window.location.href = backendUrl;
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
            <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
                {status === "processing" && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6">
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Processing...
                        </h1>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="text-6xl mb-6">✓</div>
                        <h1 className="text-2xl font-bold text-green-600 mb-2">
                            Success!
                        </h1>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            You can close this window
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="text-6xl mb-6">✗</div>
                        <h1 className="text-2xl font-bold text-red-600 mb-2">
                            Error
                        </h1>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">
                            Please try again
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
