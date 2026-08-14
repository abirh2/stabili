# Stabili

Stabili helps users find buildings that appear in official New York City rent-stabilized building records. Users can review public building information. Users can also find registered owner or management information when the public records include it.

Stabili does not confirm apartment availability. A building record does not show that a specific apartment is available or rent-stabilized.

## Architecture

Stabili uses a static production architecture.

```text
DHCR PDF files
→ Python data pipeline
→ NYC Open Data enrichment
→ generated JSON
→ React application
→ GitHub Pages
```

The production application has no backend server. The browser does not call NYC Open Data. The generated JSON files in `public/data/` contain the production dataset.

## Local development

Install Node.js 22 or a later supported version. Install Python 3.12 if you want to run the data tests or rebuild the dataset.

Install the frontend dependencies from the lockfile:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000/stabili/`.

Run the type checks:

```bash
npm run typecheck
```

Install the Python test dependencies:

```bash
python3 -m pip install -r scripts/data/requirements.txt
```

Run the tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Vite writes the production files to `dist/`.

## Data source files

The five DHCR PDF files are in `data/source/dhcr/`:

- `2024-DHCR-Bldg-File-Bronx.pdf`
- `2024-DHCR-Bldg-File-Brooklyn.pdf`
- `2024-DHCR-Bldg-File-Manhattan.pdf`
- `2024-DHCR-Bldg-File-Queens.pdf`
- `2024-DHCR-Bldg-File-Staten-Island.pdf`

These files are the rent-stabilized source records for the current dataset.

## NYC Open Data configuration

Copy `.env.example` to `.env` in the repository root. Set `NYC_OPEN_DATA_APP_TOKEN` in `.env`.

```text
NYC_OPEN_DATA_APP_TOKEN=your-token
```

Git does not commit `.env`. Local data-ingestion scripts use the token. The browser does not receive the token.

The frontend build does not require this token.

## Rebuild the dataset

Install the Python dependencies first:

```bash
python3 -m pip install -r scripts/data/requirements.txt
```

Run the complete pipeline:

```bash
npm run data:build
```

The pipeline runs these stages in order:

1. Extract the DHCR PDF records.
2. Normalize the DHCR records.
3. Match the records to NYC property data.
4. Add building and management data.
5. Add building-condition data.
6. Create the derived Stabili data.
7. Export and validate the frontend JSON.

## API cache

The local API cache is in `data/intermediate/api-cache/`. The cache keeps a reproducible NYC Open Data snapshot. It also prevents repeated network requests during local data generation.

Run this command to bypass the cache and replace it with current API responses:

```bash
npm run data:build -- --refresh-cache
```

You can also set `NYC_OPEN_DATA_CACHE_REFRESH=1` in `.env`. Use this setting only when you want to replace the cached snapshot.

The API cache is for local data generation only. The production application does not use it.

## Production data

Generated frontend JSON is in `public/data/`. The directory contains the search index, dataset metadata, and building detail files.

Git commits these generated files. GitHub Pages can serve the application without a database or backend server.

## Deployment

The `.github/workflows/deploy-pages.yml` workflow deploys Stabili to GitHub Pages. The workflow runs after a push to `main`. You can also start it manually.

The workflow installs dependencies from `package-lock.json`. It runs type checks and tests. It validates the committed production data. It builds the Vite application with the `/stabili/` base path. It then uploads and deploys the `dist/` directory.

A normal frontend deployment does not rebuild public-source data. Dataset regeneration is a separate manual task. Run `npm run data:build` only when you want to create a new dataset.
