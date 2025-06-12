# Supabase OAuth Setup Guide

This guide explains how to properly configure OAuth authentication with Google in your Supabase project to work with both localhost and production domains.

## Step 1: Configure Redirect URLs in Supabase

1. Log in to your Supabase dashboard at [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** > **URL Configuration**
4. Add all the following URLs to the **Redirect URLs** section:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:5173/auth/callback`
   - `http://localhost:8080/auth/callback`
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8082/auth/callback`
   - `http://localhost:8083/auth/callback`
   - `https://csvgenpro.netlify.app/auth/callback`
   - Add any other production domains you use

## Step 2: Configure Google OAuth Provider

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Configure your Google OAuth credentials:
   - Client ID: Your Google OAuth client ID
   - Client Secret: Your Google OAuth client secret
4. Save the changes

## Step 3: Configure Google OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **OAuth consent screen**
4. Add all your domains to the **Authorized domains** section:
   - `localhost`
   - `csvgenpro.netlify.app`
   - Add any other production domains you use
5. Save the changes

## Step 4: Configure Google OAuth Credentials

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add all the following URLs to the **Authorized redirect URIs** section:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:5173/auth/callback`
   - `http://localhost:8080/auth/callback`
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8082/auth/callback`
   - `http://localhost:8083/auth/callback`
   - `https://csvgenpro.netlify.app/auth/callback`
   - `https://jczawpxfipfceactrwry.supabase.co/auth/v1/callback`
4. Save the changes

## Testing the OAuth Flow

To test the OAuth flow:

1. Start your development server
2. Navigate to the login page
3. Click "Continue with Google"
4. You should be redirected to Google for authentication
5. After successful authentication, you should be redirected back to your application

## Troubleshooting

If you're experiencing issues with OAuth:

1. Check the browser console for any errors
2. Verify that the redirect URL in the error matches one of the authorized redirect URLs
3. Make sure your Supabase and Google OAuth configurations are in sync
4. Try clearing your browser cache and cookies
5. Check if your OAuth consent screen is properly configured

## Important Files

The following files in the codebase handle OAuth authentication:

- `src/components/GoogleLoginButton.tsx`: Handles the Google OAuth login button
- `src/pages/AuthCallback.tsx`: Handles the OAuth callback
- `src/utils/authUtils.ts`: Contains utility functions for OAuth authentication 