"""Converts Odoo product exports (.xlsx) into the quote/invoice product catalog seed.

Usage (needs: pip install openpyxl):
  python3 scripts/convert-odoo-catalog.py src/lib/data/catalog-seed.json \
      docs/finalproduct-oddo.xlsx "docs/stickers -oodo.xlsx:Stickers" docs/magnets.xlsx:Magnets

Each input is a path, optionally followed by ":<Category>" for exports that have no category column.
Later files win when the same product appears twice. Three Odoo export layouts are understood:

  1. Attribute layout (finalproduct-oddo.xlsx): one row per product, then rows listing attribute values
     ("Quantity: 500") and each value's extra price ("Products/Variant Values/Extra Price").
  2. Variant layout (stickers -oodo.xlsx): one row per product, then one group of rows per variant
     (e.g. Quantity 300 + Designing "from scratch") with that combination's total extra price.
     The catalog prices options additively, so the script checks every combination equals
     quantity extra + design extra and stops if a product doesn't follow that rule.
  3. Value layout (magnets.xlsx): one row per product, then one row per attribute value with its
     extra price ("Product Attributes/Product Attribute Values/…").

Prices are kept as exported (treated as ex GST by the app).
"""
import collections
import json
import re
import sys

import openpyxl

# Categories where Odoo has one product per quantity, e.g. "Business Cards - Standard (250)", "(500)" …
# These are merged into one product with a Quantity option (each quantity keeps its own price).
GROUP_BY_QUANTITY = {"Business Cards", "Flyers"}

# Sub-categories derived from product names, per category.
SUBCATEGORY_RULES = {
    "Stickers": [("circle", "Circle"), ("square", "Square"), ("rectangle", "Rectangle"), ("oval", "Oval")],
    "Display": [("a-frame", "A Frame"), ("pull up", "Pull Up Banners"), ("bollard", "Bollard Signs")],
}


def slug(text):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text.lower())).strip("-")[:80]


def clean(text):
    return re.sub(r"\s+", " ", str(text)).strip()


def number_key(value):
    match = re.match(r"^\s*([\d,]+)", value)
    return (0, int(match.group(1).replace(",", ""))) if match else (1, value)


def subcategory_for(category, name):
    for needle, label in SUBCATEGORY_RULES.get(category, []):
        if needle in name.lower():
            return label
    return ""


def split_value(text):
    attribute, value = str(text).split(":", 1)
    return attribute.strip(), value.strip()


def read_attribute_layout(rows, header):
    col = {name: index for index, name in enumerate(header)}
    products, current = [], None
    for row in rows:
        get = lambda name: row[col[name]] if name in col else None
        if get("Name") is not None:
            current = {"name": clean(get("Name")), "price": float(get("Sales Price") or 0), "category": clean(get("Products/Product Category/Name") or "Other"),
                       "values": collections.OrderedDict(), "extras": {}, "sequence": {}}
            products.append(current)
        if current is None:
            continue
        attribute = get("Products/Product Attributes/Attribute")
        if attribute and get("Products/Product Attributes/Sequence") is not None:
            current["sequence"][clean(attribute)] = get("Products/Product Attributes/Sequence")
        if get("Products/Variant Values/Attribute") and get("Products/Variant Values/Value") is not None:
            current["extras"][(clean(get("Products/Variant Values/Attribute")), clean(get("Products/Variant Values/Value")))] = float(get("Products/Variant Values/Extra Price") or 0)
        for key in ("Products/Product Attributes/Product Attribute Values", "Products/Product Attributes/Values"):
            if get(key) and ":" in str(get(key)):
                attribute, value = split_value(get(key))
                values = current["values"].setdefault(attribute, [])
                if value not in values:
                    values.append(value)
    return products


def read_variant_layout(rows, header, category):
    col = {name: index for index, name in enumerate(header)}
    products, current, variant = [], None, None
    for row in rows:
        get = lambda name: row[col[name]] if name in col else None
        if get("Name") is not None:
            current = {"name": clean(get("Name")), "price": float(get("Sales Price") or 0), "category": category, "values": collections.OrderedDict(), "extras": {}, "sequence": {}, "variants": []}
            products.append(current)
            variant = None
        if current is None:
            continue
        if get("Products/Attribute Values") and ":" in str(get("Products/Attribute Values")):
            attribute, value = split_value(get("Products/Attribute Values"))
            values = current["values"].setdefault(attribute, [])
            if value not in values:
                values.append(value)
        if get("Products/Variant Values") and get("Products/Variant Price Extra") is not None:
            variant = {"values": {}, "extra": float(get("Products/Variant Price Extra"))}
            current["variants"].append(variant)
        if get("Products/Variant Values") and ":" in str(get("Products/Variant Values")) and variant is not None:
            attribute, value = split_value(get("Products/Variant Values"))
            variant["values"][attribute] = value
    # Turn each product's combination table into per-option extras, checking it really is additive.
    for product in products:
        attributes = list(product["values"])
        table = {tuple(variant["values"].get(a) for a in attributes): variant["extra"] for variant in product["variants"]}
        firsts = [product["values"][a][0] for a in attributes]
        for index, attribute in enumerate(attributes):
            for value in product["values"][attribute]:
                key = tuple(value if i == index else firsts[i] for i in range(len(attributes)))
                product["extras"][(attribute, value)] = table.get(key, 0) - table.get(tuple(firsts), 0)
        for combination, extra in table.items():
            expected = table.get(tuple(firsts), 0) + sum(product["extras"].get((attributes[i], value), 0) for i, value in enumerate(combination))
            if abs(expected - extra) > 0.005:
                sys.exit(f"{product['name']}: price for {dict(zip(attributes, combination))} is {extra}, not additive ({expected}). Needs a combination price table.")
        product["price"] += table.get(tuple(firsts), 0)
    return products


def read_value_layout(rows, header, category):
    col = {name: index for index, name in enumerate(header)}
    prefix = "Product Attributes/Product Attribute Values/"
    products, current = [], None
    for row in rows:
        get = lambda name: row[col[name]] if name in col else None
        if get("Name") is not None:
            current = {"name": clean(get("Name")), "price": float(get("Sales Price") or 0), "category": category, "values": collections.OrderedDict(), "extras": {}, "sequence": {}}
            products.append(current)
        if current is None:
            continue
        attribute, value = get(prefix + "Attribute"), get(prefix + "Value")
        if attribute and value is not None and get(prefix + "Active") is not False:
            attribute, value = clean(attribute), clean(value)
            values = current["values"].setdefault(attribute, [])
            if value not in values:
                values.append(value)
            current["extras"][(attribute, value)] = float(get(prefix + "Extra Price") or 0)
    return products


def to_catalog(product):
    options = []
    # Odoo's attribute sequence when exported; otherwise a consistent order (Quantity, Designing, Shape, then the rest).
    preferred = {"Quantity": 0, "Designing": 1, "Shape": 2}
    for attribute in sorted(product["values"], key=lambda a: (product["sequence"].get(a, 99), preferred.get(a, 9))):
        values = product["values"][attribute]
        if attribute == "Quantity":
            values = sorted(values, key=number_key)
        entries = [{"label": value, "extraCents": round(product["extras"].get((attribute, value), 0) * 100)} for value in values]
        if attribute == "Designing":
            entries.sort(key=lambda entry: entry["extraCents"])
        options.append({"name": attribute, "values": entries})
    item = {"id": slug(product["name"]), "name": product["name"], "category": product["category"], "priceCents": round(product["price"] * 100), "unit": "each", "options": options}
    subcategory = subcategory_for(product["category"], product["name"])
    if subcategory:
        item["subcategory"] = subcategory
    return item


def group_by_quantity(items):
    """Merges "<name> (<qty>)" products in GROUP_BY_QUANTITY categories into one product with a Quantity option."""
    groups, out = collections.OrderedDict(), []
    for item in items:
        match = re.match(r"^(.*?)\s*\(([\d,]+)\)$", item["name"])
        if item["category"] in GROUP_BY_QUANTITY and match and not item["options"]:
            groups.setdefault((item["category"], match.group(1).strip()), []).append((int(match.group(2).replace(",", "")), item))
        else:
            out.append(item)
    for (category, name), entries in groups.items():
        entries.sort(key=lambda entry: entry[0])
        base = min(entry[1]["priceCents"] for entry in entries)
        merged = {"id": slug(name), "name": name, "category": category, "priceCents": base, "unit": "each",
                  "options": [{"name": "Quantity", "values": [{"label": str(quantity), "extraCents": item["priceCents"] - base} for quantity, item in entries]}]}
        out.append(merged)
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    output, inputs = sys.argv[1], sys.argv[2:]
    catalog = collections.OrderedDict()
    for spec in inputs:
        path, _, category = spec.partition(".xlsx:")
        path = path if path.endswith(".xlsx") else f"{path}.xlsx"
        rows = list(openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0].iter_rows(values_only=True))
        header = [clean(cell) if cell is not None else "" for cell in rows[0]]
        if "Product Attributes/Product Attribute Values/Extra Price" in header:
            products = read_value_layout(rows[1:], header, category or "Other")
        elif "Products/Variant Price Extra" in header:
            products = read_variant_layout(rows[1:], header, category or "Other")
        else:
            products = read_attribute_layout(rows[1:], header)
        for product in products:
            item = to_catalog(product)
            catalog[item["id"]] = item
        print(f"{path}: {len(products)} products")
    items = group_by_quantity(list(catalog.values()))
    json.dump(items, open(output, "w"), indent=1, ensure_ascii=False)
    print(f"{output}: {len(items)} products")


if __name__ == "__main__":
    main()
