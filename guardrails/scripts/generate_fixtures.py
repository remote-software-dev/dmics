#!/usr/bin/env python3
"""
generate_fixtures.py — Generate expected API response fixtures from fixture JSON files.

This script reads the fixture data files and generates expected response structures
for use in pytest tests.
"""

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def load_fixture(name: str) -> list:
    with open(FIXTURES_DIR / name) as f:
        return json.load(f)


def generate_province_responses():
    provinces = load_fixture("provinces.json")
    return {
        "list_all": {
            "count": len(provinces),
            "sample": provinces[0] if provinces else None,
        },
        "by_id": {
            "id": provinces[0]["id"] if provinces else None,
            "expected": provinces[0] if provinces else None,
        },
    }


def generate_district_responses():
    districts = load_fixture("districts.json")
    return {
        "list_all": {
            "count": len(districts),
            "sample": districts[0] if districts else None,
        }
    }


def main():
    responses = {
        "provinces": generate_province_responses(),
        "districts": generate_district_responses(),
    }

    output_path = FIXTURES_DIR / "generated_responses.json"
    with open(output_path, "w") as f:
        json.dump(responses, f, indent=2)

    print(f"Generated responses written to {output_path}")


if __name__ == "__main__":
    main()
