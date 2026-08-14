<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8e9ccdb2-1a6f-467a-9269-29e38decf790

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Rebuild the production data

Install the pinned Python dependency once, then run the complete pipeline from
the five source PDFs through static JSON export and final validation:

```bash
python3 -m pip install -r scripts/data/requirements.txt
npm run data:build
```

NYC stages reuse the reproducible local API cache by default. To intentionally
retrieve a new Open Data snapshot (with `NYC_OPEN_DATA_APP_TOKEN` configured in
`.env`), run `npm run data:build -- --refresh-cache`.

Production artifacts are written to `public/data/`. Intermediate API responses
and working files stay in gitignored `data/intermediate/`. The final size and
record-count audit is `data/reports/export-report.json`.
