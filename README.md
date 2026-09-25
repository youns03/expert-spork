<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/818f9fc2-1124-4452-8891-76c960b48f54

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android APK with Capacitor

The Android wrapper is generated in `android/` and preserves the existing React UI. Before building the APK, set `VITE_API_BASE_URL` to the HTTPS URL of the deployed Node backend in the environment used for the build. Keep `GEMINI_API_KEY` on the backend only; it must never be placed in the APK.

Install dependencies, build the web assets, and synchronize Capacitor:

```bash
pnpm install
pnpm run mobile:build
```

Then open the Android project in Android Studio and build or run the APK:

```bash
pnpm run mobile:open
```

The backend remains required for `/api/tts`, `/api/translate`, and `/api/transcribe-audio`. The Android SDK and Android Studio are required to produce the final APK or AAB.

## Native Android track

For a native Android application without WebView, the parallel project in `native-android/` uses Kotlin and Jetpack Compose. It connects to the same personal Node backend, which keeps the Gemini key on the server. This track is being migrated feature by feature; the existing React application remains the functional reference until audio playback, local storage, file access, and the full lesson UI have been ported and verified on Android.
