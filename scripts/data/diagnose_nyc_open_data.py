#!/usr/bin/env python3
"""Run a small authenticated NYC Open Data connectivity diagnostic."""

from __future__ import annotations

import argparse
import sys

from nyc_open_data import NycOpenDataClient, NycOpenDataError


# NYC 311 Service Requests from 2010 to present.
DIAGNOSTIC_DATASET_ID = "erm2-nwe9"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh-cache",
        action="store_true",
        help="bypass and refresh the local build-time request cache",
    )
    args = parser.parse_args()
    client = NycOpenDataClient(
        refresh_cache=True if args.refresh_cache else None
    )
    try:
        result = client.fetch(
            DIAGNOSTIC_DATASET_ID,
            select=("unique_key", "created_date", "agency"),
            order="created_date DESC",
            limit=5,
        )
    except NycOpenDataError as error:
        print(
            f"HTTP success: no\nDataset queried: {DIAGNOSTIC_DATASET_ID}\n"
            f"Error: {error}",
            file=sys.stderr,
        )
        return 1

    print("HTTP success: yes")
    print(f"Dataset queried: {result.provenance.dataset_id}")
    print(f"Records returned: {len(result.records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
