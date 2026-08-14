#!/usr/bin/env python3
"""Run the complete Stabili source-to-static-JSON data pipeline."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path
from typing import Sequence


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
STAGES = (
    "extract_dhcr.py",
    "normalize_dhcr.py",
    "match_properties.py",
    "enrich_nyc_management.py",
    "enrich_nyc_conditions.py",
    "derive_stabili_data.py",
    "export_stabili_data.py",
)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh-cache",
        action="store_true",
        help="Refresh NYC Open Data caches instead of rebuilding from the pinned local snapshot.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    for stage in STAGES:
        command = [sys.executable, str(REPOSITORY_ROOT / "scripts" / "data" / stage)]
        if args.refresh_cache and stage in {
            "match_properties.py", "enrich_nyc_management.py", "enrich_nyc_conditions.py"
        }:
            command.append("--refresh-cache")
        print(f"\n==> {stage}", flush=True)
        subprocess.run(command, cwd=REPOSITORY_ROOT, check=True)
    print("\n==> validate:data", flush=True)
    subprocess.run(
        ["node", "--import", "tsx", "scripts/data/validate-frontend-data.ts"],
        cwd=REPOSITORY_ROOT,
        check=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
