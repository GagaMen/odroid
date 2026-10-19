#!/usr/bin/env python3
"""Prepare a Trade Republic CSV export for import into Actual Budget.

Trade Republic lists fees and taxes in their own columns, while Actual takes
the amount of a transaction from a single column. This adds a `total` column,
amount + fee + tax (an empty value counts as 0); pick `total` instead of
`amount` as the amount in Actual's import dialog.

Usage:
  trade-republic.py <export.csv>                 writes <export>.actual.csv
  trade-republic.py <export.csv> --drop-trades   also leaves out security trades
  trade-republic.py <export.csv> --show-types    lists the category/type values

--drop-trades leaves out every row whose `category` is TRADING, i.e. security
buys and sells. Use it when the securities are tracked outside Actual and only
the cash account is budgeted.
"""
import argparse
import csv
import sys
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

TRADE_CATEGORY = "TRADING"


def dec(value):
    value = (value or "").strip()
    if not value:
        return Decimal("0")
    try:
        return Decimal(value)
    except InvalidOperation:
        sys.exit(f"cannot read amount: {value!r}")


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("export", type=Path, help="CSV export from Trade Republic")
    parser.add_argument("--drop-trades", action="store_true", help="leave out security trades")
    parser.add_argument("--show-types", action="store_true", help="list category/type values and exit")
    args = parser.parse_args()

    with args.export.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fields = list(reader.fieldnames or [])

    if args.show_types:
        counts = Counter((r.get("category", ""), r.get("type", "")) for r in rows)
        for (category, type_), n in counts.most_common():
            print(f"{n:5}  category={category!r:20} type={type_!r}")
        return

    out_rows = []
    for row in rows:
        if args.drop_trades and row.get("category", "").upper() == TRADE_CATEGORY:
            continue
        row["total"] = str(dec(row.get("amount")) + dec(row.get("fee")) + dec(row.get("tax")))
        out_rows.append(row)

    dst = args.export.with_suffix(".actual.csv")
    with dst.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields + ["total"])
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"{len(out_rows)} of {len(rows)} rows -> {dst}")


if __name__ == "__main__":
    main()
