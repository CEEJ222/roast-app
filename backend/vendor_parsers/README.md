# Vendor Parsers

This directory contains parsers for different coffee suppliers and vendors. Each vendor has its own subdirectory with specialized parsing logic.

## Structure

```
vendor_parsers/
├── __init__.py
├── README.md
└── sweet_marias/
    ├── __init__.py
    ├── sweet_marias_parser.py    # Main HTML parser
    ├── test_parser.py            # Test scripts
    └── test_real_html.py        # Real HTML tests
```

## Sweet Maria's Parser

The Sweet Maria's parser handles:
- **HTML Parsing**: Extracts bean data from Sweet Maria's product pages
- **AI Optimization**: Uses AI to enhance and structure the data
- **Data Validation**: Ensures data quality and completeness

### Usage

```python
from vendor_parsers.sweet_marias import (
    parse_sweet_marias_html,
    get_ai_optimized_data
)

# Parse HTML content
html_data = parse_sweet_marias_html(html_content)
ai_data = get_ai_optimized_data(html_content)
```

## Adding New Vendors

To add a new vendor parser:

1. Create a new directory: `vendor_parsers/{vendor_name}/`
2. Add an `__init__.py` file with exports
3. Implement the parser functions
4. Add tests
5. Update this README

### Example Structure for New Vendor

```
vendor_parsers/
└── {vendor_name}/
    ├── __init__.py
    ├── parser.py
    ├── tests.py
    └── README.md
```

## Testing

Run tests for all parsers:
```bash
cd backend
python -m pytest vendor_parsers/
```

Run tests for specific vendor:
```bash
cd backend/vendor_parsers/sweet_marias
python test_parser.py
```
