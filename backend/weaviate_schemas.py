"""
Weaviate Schema Definitions for Coffee Roasting App
Defines vector database schemas for coffee beans, roast profiles, and semantic search
"""

from typing import Dict, Any, List

def get_bean_profile_schema() -> Dict[str, Any]:
    """Schema for coffee bean profiles with semantic search capabilities"""
    return {
        "class": "BeanProfile",
        "description": "Coffee bean profiles with detailed characteristics for semantic search",
        "vectorizer": "text2vec-transformers",  # Use local transformers
        "moduleConfig": {
            "text2vec-transformers": {
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "passageModel": "sentence-transformers/all-MiniLM-L6-v2",
                "queryModel": "sentence-transformers/all-MiniLM-L6-v2"
            }
        },
        "properties": [
            {
                "name": "name",
                "dataType": ["text"],
                "description": "Bean name/title"
            },
            {
                "name": "supplier",
                "dataType": ["text"],
                "description": "Coffee supplier/roaster name"
            },
            {
                "name": "origin",
                "dataType": ["text"],
                "description": "Country/region of origin"
            },
            {
                "name": "variety",
                "dataType": ["text"],
                "description": "Coffee variety (e.g., Bourbon, Typica)"
            },
            {
                "name": "processing",
                "dataType": ["text"],
                "description": "Processing method (washed, natural, honey, etc.)"
            },
            {
                "name": "elevation",
                "dataType": ["number"],
                "description": "Growing elevation in meters"
            },
            {
                "name": "flavor_notes",
                "dataType": ["text[]"],
                "description": "Array of flavor descriptors"
            },
            {
                "name": "aroma_notes",
                "dataType": ["text[]"],
                "description": "Array of aroma descriptors"
            },
            {
                "name": "body",
                "dataType": ["text"],
                "description": "Body description (light, medium, full)"
            },
            {
                "name": "acidity",
                "dataType": ["text"],
                "description": "Acidity level and type"
            },
            {
                "name": "sweetness",
                "dataType": ["text"],
                "description": "Sweetness characteristics"
            },
            {
                "name": "cupping_score",
                "dataType": ["number"],
                "description": "Cupping score (0-100)"
            },
            {
                "name": "roast_level",
                "dataType": ["text"],
                "description": "Recommended roast level"
            },
            {
                "name": "description",
                "dataType": ["text"],
                "description": "Detailed bean description for semantic search"
            },
            {
                "name": "supplier_url",
                "dataType": ["text"],
                "description": "Original supplier URL"
            },
            {
                "name": "price_per_pound",
                "dataType": ["number"],
                "description": "Price per pound in USD"
            },
            {
                "name": "availability",
                "dataType": ["text"],
                "description": "Availability status"
            },
            {
                "name": "harvest_year",
                "dataType": ["text"],
                "description": "Harvest year"
            },
            {
                "name": "certifications",
                "dataType": ["text[]"],
                "description": "Certifications (organic, fair trade, etc.)"
            },
            {
                "name": "user_id",
                "dataType": ["text"],
                "description": "User who added this bean profile"
            },
            {
                "name": "created_at",
                "dataType": ["date"],
                "description": "Creation timestamp"
            },
            {
                "name": "updated_at",
                "dataType": ["date"],
                "description": "Last update timestamp"
            }
        ]
    }

def get_roast_profile_schema() -> Dict[str, Any]:
    """Schema for roast profiles with semantic search capabilities"""
    return {
        "class": "RoastProfile",
        "description": "Coffee roast profiles with detailed characteristics for semantic search",
        "vectorizer": "text2vec-transformers",
        "moduleConfig": {
            "text2vec-transformers": {
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "passageModel": "sentence-transformers/all-MiniLM-L6-v2",
                "queryModel": "sentence-transformers/all-MiniLM-L6-v2"
            }
        },
        "properties": [
            {
                "name": "name",
                "dataType": ["text"],
                "description": "Roast profile name"
            },
            {
                "name": "bean_profile_id",
                "dataType": ["text"],
                "description": "Reference to bean profile"
            },
            {
                "name": "roast_level",
                "dataType": ["text"],
                "description": "Roast level (light, medium, dark, etc.)"
            },
            {
                "name": "roast_time",
                "dataType": ["number"],
                "description": "Total roast time in minutes"
            },
            {
                "name": "charge_temp",
                "dataType": ["number"],
                "description": "Charge temperature in Fahrenheit"
            },
            {
                "name": "first_crack_time",
                "dataType": ["number"],
                "description": "First crack time in minutes"
            },
            {
                "name": "first_crack_temp",
                "dataType": ["number"],
                "description": "First crack temperature in Fahrenheit"
            },
            {
                "name": "second_crack_time",
                "dataType": ["number"],
                "description": "Second crack time in minutes"
            },
            {
                "name": "second_crack_temp",
                "dataType": ["number"],
                "description": "Second crack temperature in Fahrenheit"
            },
            {
                "name": "drop_temp",
                "dataType": ["number"],
                "description": "Drop temperature in Fahrenheit"
            },
            {
                "name": "roast_notes",
                "dataType": ["text"],
                "description": "Roasting notes and observations"
            },
            {
                "name": "flavor_notes",
                "dataType": ["text[]"],
                "description": "Post-roast flavor notes"
            },
            {
                "name": "aroma_notes",
                "dataType": ["text[]"],
                "description": "Post-roast aroma notes"
            },
            {
                "name": "body_rating",
                "dataType": ["number"],
                "description": "Body rating (1-10)"
            },
            {
                "name": "acidity_rating",
                "dataType": ["number"],
                "description": "Acidity rating (1-10)"
            },
            {
                "name": "sweetness_rating",
                "dataType": ["number"],
                "description": "Sweetness rating (1-10)"
            },
            {
                "name": "overall_rating",
                "dataType": ["number"],
                "description": "Overall roast rating (1-10)"
            },
            {
                "name": "roaster_model",
                "dataType": ["text"],
                "description": "Roaster model used"
            },
            {
                "name": "batch_size",
                "dataType": ["number"],
                "description": "Batch size in pounds"
            },
            {
                "name": "ambient_temp",
                "dataType": ["number"],
                "description": "Ambient temperature during roast"
            },
            {
                "name": "humidity",
                "dataType": ["number"],
                "description": "Humidity percentage during roast"
            },
            {
                "name": "user_id",
                "dataType": ["text"],
                "description": "User who created this roast profile"
            },
            {
                "name": "created_at",
                "dataType": ["date"],
                "description": "Creation timestamp"
            },
            {
                "name": "updated_at",
                "dataType": ["date"],
                "description": "Last update timestamp"
            }
        ]
    }

def get_roast_event_schema() -> Dict[str, Any]:
    """Schema for individual roast events/timestamps"""
    return {
        "class": "RoastEvent",
        "description": "Individual roast events with temperature and time data",
        "vectorizer": "text2vec-transformers",
        "moduleConfig": {
            "text2vec-transformers": {
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "passageModel": "sentence-transformers/all-MiniLM-L6-v2",
                "queryModel": "sentence-transformers/all-MiniLM-L6-v2"
            }
        },
        "properties": [
            {
                "name": "roast_profile_id",
                "dataType": ["text"],
                "description": "Reference to roast profile"
            },
            {
                "name": "timestamp",
                "dataType": ["number"],
                "description": "Event timestamp in seconds from start"
            },
            {
                "name": "temperature",
                "dataType": ["number"],
                "description": "Temperature in Fahrenheit"
            },
            {
                "name": "event_type",
                "dataType": ["text"],
                "description": "Event type (charge, first_crack, second_crack, drop, etc.)"
            },
            {
                "name": "notes",
                "dataType": ["text"],
                "description": "Event notes and observations"
            },
            {
                "name": "user_id",
                "dataType": ["text"],
                "description": "User who recorded this event"
            },
            {
                "name": "created_at",
                "dataType": ["date"],
                "description": "Creation timestamp"
            }
        ]
    }

def get_all_schemas() -> List[Dict[str, Any]]:
    """Get all schema definitions"""
    return [
        get_bean_profile_schema(),
        get_roast_profile_schema(),
        get_roast_event_schema()
    ]

def get_schema_by_class(class_name: str) -> Dict[str, Any]:
    """Get schema by class name"""
    schemas = {
        "BeanProfile": get_bean_profile_schema(),
        "RoastProfile": get_roast_profile_schema(),
        "RoastEvent": get_roast_event_schema()
    }
    return schemas.get(class_name, {})
