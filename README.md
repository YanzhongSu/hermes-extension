# Hermes Chrome Extension

Browser-native frontend for Hermes Agent. The extension opens Hermes in Chrome's Side Panel and connects to a running Hermes API server through the OpenAI-compatible `/v1/chat/completions` endpoint.

## Prerequisites

Run Hermes with the API server enabled:

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=<generate with: openssl rand -hex 32>
```

For a remote Hermes server, also set:

```bash
API_SERVER_HOST=0.0.0.0
```

## Development Setup

```bash
npm install
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this repo's `dist/` directory.

For rebuilds while developing:

```bash
npm run dev
```

## Configuration

Click the Hermes extension icon to open the Side Panel, then open **Settings**.

Set:

```text
API URL: http://127.0.0.1:8642
API Key: <your API_SERVER_KEY>
```

For remote Hermes, use the remote host and port in the API URL.

## Stable Extension ID (add later)

To make the extension ID stable across dev and production:

1. Create a Chrome Web Store developer account.
2. Generate a key pair or get the extension ID from the Web Store listing.
3. Add the `key` field to `manifest.json` using Chrome's extension docs.
4. Set `API_SERVER_CORS_ORIGINS` in hermes-agent to:

```bash
API_SERVER_CORS_ORIGINS=chrome-extension://<your-stable-id>
```

Do not add a placeholder `key` field to `manifest.json`; Chrome treats unknown or placeholder fields as real manifest data.

## Building for Production

```bash
npm run build
```

The production extension is written to `dist/`.

## CORS Setup

During local development with an unstable unpacked-extension ID:

```bash
API_SERVER_CORS_ORIGINS=*
```

For production:

```bash
API_SERVER_CORS_ORIGINS=chrome-extension://<your-stable-extension-id>
```

See the Hermes Agent guide:

```text
website/docs/user-guide/messaging/chrome-extension.md
```
