"""
RAG-Enhanced Database Schemas for Roasting Copilot

This module defines the enhanced database schemas needed for the RAG-powered
roasting copilot system, including roast outcomes, reflections, and AI coaching data.
"""

from typing import Dict, Any, List
from datetime import datetime

def get_roast_outcomes_schema() -> Dict[str, Any]:
    """Schema for roast outcomes and reflections table"""
    return {
        "table_name": "roast_outcomes",
        "description": "Stores roast outcomes, reflections, and AI coaching data for RAG system",
        "fields": [
            {
                "name": "id",
                "type": "UUID",
                "constraints": "PRIMARY KEY",
                "description": "Unique identifier for roast outcome"
            },
            {
                "name": "roast_id",
                "type": "BIGINT",
                "constraints": "NOT NULL, REFERENCES roast_entries(id)",
                "description": "Foreign key to roast_entries table"
            },
            {
                "name": "user_id",
                "type": "UUID",
                "constraints": "NOT NULL, REFERENCES auth.users(id)",
                "description": "User who created this outcome"
            },
            {
                "name": "actual_roast_level",
                "type": "TEXT",
                "constraints": "",
                "description": "Actual roast level achieved (City, City+, Full City, etc.)"
            },
            {
                "name": "weight_after_g",
                "type": "FLOAT",
                "constraints": "",
                "description": "Final weight after roasting"
            },
            {
                "name": "weight_loss_pct",
                "type": "FLOAT",
                "constraints": "",
                "description": "Calculated weight loss percentage"
            },
            {
                "name": "roast_duration_minutes",
                "type": "FLOAT",
                "constraints": "",
                "description": "Total roast duration in minutes"
            },
            {
                "name": "development_time_minutes",
                "type": "FLOAT",
                "constraints": "",
                "description": "Development time (first crack to drop)"
            },
            {
                "name": "development_ratio",
                "type": "FLOAT",
                "constraints": "",
                "description": "Development ratio (development time / total time)"
            },
            {
                "name": "charge_temp_f",
                "type": "FLOAT",
                "constraints": "",
                "description": "Charge temperature in Fahrenheit"
            },
            {
                "name": "first_crack_temp_f",
                "type": "FLOAT",
                "constraints": "",
                "description": "First crack temperature in Fahrenheit"
            },
            {
                "name": "second_crack_temp_f",
                "type": "FLOAT",
                "constraints": "",
                "description": "Second crack temperature in Fahrenheit"
            },
            {
                "name": "drop_temp_f",
                "type": "FLOAT",
                "constraints": "",
                "description": "Drop temperature in Fahrenheit"
            },
            {
                "name": "max_temp_f",
                "type": "FLOAT",
                "constraints": "",
                "description": "Maximum temperature reached during roast"
            },
            {
                "name": "avg_ror",
                "type": "FLOAT",
                "constraints": "",
                "description": "Average rate of rise during roast"
            },
            {
                "name": "tasting_notes",
                "type": "TEXT",
                "constraints": "",
                "description": "Detailed tasting notes and observations"
            },
            {
                "name": "flavor_profile",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of flavor descriptors"
            },
            {
                "name": "aroma_profile",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of aroma descriptors"
            },
            {
                "name": "body_rating",
                "type": "INTEGER",
                "constraints": "CHECK (body_rating >= 1 AND body_rating <= 10)",
                "description": "Body rating (1-10)"
            },
            {
                "name": "acidity_rating",
                "type": "INTEGER",
                "constraints": "CHECK (acidity_rating >= 1 AND acidity_rating <= 10)",
                "description": "Acidity rating (1-10)"
            },
            {
                "name": "sweetness_rating",
                "type": "INTEGER",
                "constraints": "CHECK (sweetness_rating >= 1 AND sweetness_rating <= 10)",
                "description": "Sweetness rating (1-10)"
            },
            {
                "name": "overall_rating",
                "type": "INTEGER",
                "constraints": "CHECK (overall_rating >= 1 AND overall_rating <= 10)",
                "description": "Overall roast rating (1-10)"
            },
            {
                "name": "roast_quality",
                "type": "TEXT",
                "constraints": "CHECK (roast_quality IN ('excellent', 'good', 'fair', 'poor'))",
                "description": "Overall roast quality assessment"
            },
            {
                "name": "roast_consistency",
                "type": "TEXT",
                "constraints": "CHECK (roast_consistency IN ('very_consistent', 'consistent', 'somewhat_inconsistent', 'inconsistent'))",
                "description": "Roast consistency assessment"
            },
            {
                "name": "roast_challenges",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of challenges encountered during roast"
            },
            {
                "name": "roast_successes",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of successful aspects of the roast"
            },
            {
                "name": "improvement_notes",
                "type": "TEXT",
                "constraints": "",
                "description": "Notes on what to improve next time"
            },
            {
                "name": "roast_reflections",
                "type": "TEXT",
                "constraints": "",
                "description": "Detailed reflections on the roast process and outcome"
            },
            {
                "name": "ai_insights",
                "type": "JSONB",
                "constraints": "",
                "description": "AI-generated insights and analysis"
            },
            {
                "name": "similar_roasts",
                "type": "JSONB",
                "constraints": "",
                "description": "References to similar historical roasts"
            },
            {
                "name": "created_at",
                "type": "TIMESTAMPTZ",
                "constraints": "DEFAULT NOW()",
                "description": "Creation timestamp"
            },
            {
                "name": "updated_at",
                "type": "TIMESTAMPTZ",
                "constraints": "DEFAULT NOW()",
                "description": "Last update timestamp"
            }
        ]
    }

def get_roast_curves_schema() -> Dict[str, Any]:
    """Schema for detailed roast curve data table"""
    return {
        "table_name": "roast_curves",
        "description": "Stores detailed temperature curve data for AI analysis",
        "fields": [
            {
                "name": "id",
                "type": "UUID",
                "constraints": "PRIMARY KEY",
                "description": "Unique identifier for roast curve"
            },
            {
                "name": "roast_id",
                "type": "BIGINT",
                "constraints": "NOT NULL, REFERENCES roast_entries(id)",
                "description": "Foreign key to roast_entries table"
            },
            {
                "name": "user_id",
                "type": "UUID",
                "constraints": "NOT NULL, REFERENCES auth.users(id)",
                "description": "User who created this curve"
            },
            {
                "name": "curve_data",
                "type": "JSONB",
                "constraints": "",
                "description": "Compressed temperature time-series data"
            },
            {
                "name": "ror_data",
                "type": "JSONB",
                "constraints": "",
                "description": "Rate of rise calculations"
            },
            {
                "name": "curve_analysis",
                "type": "JSONB",
                "constraints": "",
                "description": "AI-generated curve insights and analysis"
            },
            {
                "name": "curve_shape",
                "type": "TEXT",
                "constraints": "",
                "description": "Curve shape classification (linear, exponential, etc.)"
            },
            {
                "name": "curve_quality",
                "type": "TEXT",
                "constraints": "CHECK (curve_quality IN ('excellent', 'good', 'fair', 'poor'))",
                "description": "Curve quality assessment"
            },
            {
                "name": "created_at",
                "type": "TIMESTAMPTZ",
                "constraints": "DEFAULT NOW()",
                "description": "Creation timestamp"
            }
        ]
    }

def get_ai_coaching_schema() -> Dict[str, Any]:
    """Schema for AI coaching recommendations table"""
    return {
        "table_name": "ai_coaching",
        "description": "Stores AI coaching recommendations and insights",
        "fields": [
            {
                "name": "id",
                "type": "UUID",
                "constraints": "PRIMARY KEY",
                "description": "Unique identifier for coaching record"
            },
            {
                "name": "user_id",
                "type": "UUID",
                "constraints": "NOT NULL, REFERENCES auth.users(id)",
                "description": "User receiving coaching"
            },
            {
                "name": "roast_id",
                "type": "BIGINT",
                "constraints": "REFERENCES roast_entries(id)",
                "description": "Specific roast being coached (if applicable)"
            },
            {
                "name": "coaching_type",
                "type": "TEXT",
                "constraints": "CHECK (coaching_type IN ('pre_roast', 'during_roast', 'post_roast', 'general'))",
                "description": "Type of coaching provided"
            },
            {
                "name": "recommendation",
                "type": "TEXT",
                "constraints": "",
                "description": "AI-generated recommendation"
            },
            {
                "name": "reasoning",
                "type": "TEXT",
                "constraints": "",
                "description": "Explanation for the recommendation"
            },
            {
                "name": "confidence_score",
                "type": "FLOAT",
                "constraints": "CHECK (confidence_score >= 0 AND confidence_score <= 1)",
                "description": "AI confidence in the recommendation (0-1)"
            },
            {
                "name": "similar_roasts",
                "type": "JSONB",
                "constraints": "",
                "description": "References to similar historical roasts used for recommendation"
            },
            {
                "name": "context_data",
                "type": "JSONB",
                "constraints": "",
                "description": "Context data used for the recommendation"
            },
            {
                "name": "user_feedback",
                "type": "TEXT",
                "constraints": "",
                "description": "User feedback on the recommendation"
            },
            {
                "name": "effectiveness_rating",
                "type": "INTEGER",
                "constraints": "CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5)",
                "description": "User rating of recommendation effectiveness (1-5)"
            },
            {
                "name": "created_at",
                "type": "TIMESTAMPTZ",
                "constraints": "DEFAULT NOW()",
                "description": "Creation timestamp"
            }
        ]
    }

def get_enhanced_roast_entries_schema() -> Dict[str, Any]:
    """Enhanced roast_entries table schema with RAG-specific fields"""
    return {
        "table_name": "roast_entries",
        "description": "Enhanced roast entries table with RAG-specific fields",
        "new_fields": [
            {
                "name": "roast_name",
                "type": "TEXT",
                "constraints": "",
                "description": "User-defined name for the roast"
            },
            {
                "name": "roast_goals",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of roast goals and objectives"
            },
            {
                "name": "roast_challenges",
                "type": "TEXT[]",
                "constraints": "",
                "description": "Array of anticipated challenges"
            },
            {
                "name": "roast_strategy",
                "type": "TEXT",
                "constraints": "",
                "description": "Planned roasting strategy"
            },
            {
                "name": "ai_recommendations",
                "type": "JSONB",
                "constraints": "",
                "description": "AI-generated pre-roast recommendations"
            },
            {
                "name": "roast_status",
                "type": "TEXT",
                "constraints": "CHECK (roast_status IN ('planned', 'in_progress', 'completed', 'cancelled'))",
                "description": "Current status of the roast"
            },
            {
                "name": "roast_outcome_id",
                "type": "UUID",
                "constraints": "REFERENCES roast_outcomes(id)",
                "description": "Reference to roast outcome record"
            }
        ]
    }

def get_all_rag_schemas() -> List[Dict[str, Any]]:
    """Get all RAG-enhanced schemas"""
    return [
        get_roast_outcomes_schema(),
        get_roast_curves_schema(),
        get_ai_coaching_schema(),
        get_enhanced_roast_entries_schema()
    ]

def generate_sql_migrations() -> List[str]:
    """Generate SQL migration scripts for RAG schemas"""
    migrations = []
    
    # Create roast_outcomes table
    migrations.append("""
    CREATE TABLE IF NOT EXISTS roast_outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roast_id BIGINT NOT NULL REFERENCES roast_entries(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        actual_roast_level TEXT,
        weight_after_g FLOAT,
        weight_loss_pct FLOAT,
        roast_duration_minutes FLOAT,
        development_time_minutes FLOAT,
        development_ratio FLOAT,
        charge_temp_f FLOAT,
        first_crack_temp_f FLOAT,
        second_crack_temp_f FLOAT,
        drop_temp_f FLOAT,
        max_temp_f FLOAT,
        avg_ror FLOAT,
        tasting_notes TEXT,
        flavor_profile TEXT[],
        aroma_profile TEXT[],
        body_rating INTEGER CHECK (body_rating >= 1 AND body_rating <= 10),
        acidity_rating INTEGER CHECK (acidity_rating >= 1 AND acidity_rating <= 10),
        sweetness_rating INTEGER CHECK (sweetness_rating >= 1 AND sweetness_rating <= 10),
        overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
        roast_quality TEXT CHECK (roast_quality IN ('excellent', 'good', 'fair', 'poor')),
        roast_consistency TEXT CHECK (roast_consistency IN ('very_consistent', 'consistent', 'somewhat_inconsistent', 'inconsistent')),
        roast_challenges TEXT[],
        roast_successes TEXT[],
        improvement_notes TEXT,
        roast_reflections TEXT,
        ai_insights JSONB,
        similar_roasts JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)
    
    # Create roast_curves table
    migrations.append("""
    CREATE TABLE IF NOT EXISTS roast_curves (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roast_id BIGINT NOT NULL REFERENCES roast_entries(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        curve_data JSONB,
        ror_data JSONB,
        curve_analysis JSONB,
        curve_shape TEXT,
        curve_quality TEXT CHECK (curve_quality IN ('excellent', 'good', 'fair', 'poor')),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)
    
    # Create ai_coaching table
    migrations.append("""
    CREATE TABLE IF NOT EXISTS ai_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        roast_id BIGINT REFERENCES roast_entries(id) ON DELETE CASCADE,
        coaching_type TEXT CHECK (coaching_type IN ('pre_roast', 'during_roast', 'post_roast', 'general')),
        recommendation TEXT,
        reasoning TEXT,
        confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
        similar_roasts JSONB,
        context_data JSONB,
        user_feedback TEXT,
        effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """)
    
    # Add new fields to roast_entries table
    migrations.append("""
    ALTER TABLE roast_entries 
    ADD COLUMN IF NOT EXISTS roast_name TEXT,
    ADD COLUMN IF NOT EXISTS roast_goals TEXT[],
    ADD COLUMN IF NOT EXISTS roast_challenges TEXT[],
    ADD COLUMN IF NOT EXISTS roast_strategy TEXT,
    ADD COLUMN IF NOT EXISTS ai_recommendations JSONB,
    ADD COLUMN IF NOT EXISTS roast_status TEXT DEFAULT 'planned' CHECK (roast_status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    ADD COLUMN IF NOT EXISTS roast_outcome_id UUID REFERENCES roast_outcomes(id);
    """)
    
    # Create indexes for performance
    migrations.append("""
    CREATE INDEX IF NOT EXISTS idx_roast_outcomes_user_id ON roast_outcomes(user_id);
    CREATE INDEX IF NOT EXISTS idx_roast_outcomes_roast_id ON roast_outcomes(roast_id);
    CREATE INDEX IF NOT EXISTS idx_roast_curves_user_id ON roast_curves(user_id);
    CREATE INDEX IF NOT EXISTS idx_roast_curves_roast_id ON roast_curves(roast_id);
    CREATE INDEX IF NOT EXISTS idx_ai_coaching_user_id ON ai_coaching(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_coaching_roast_id ON ai_coaching(roast_id);
    CREATE INDEX IF NOT EXISTS idx_roast_entries_status ON roast_entries(roast_status);
    """)
    
    # Enable RLS on new tables
    migrations.append("""
    ALTER TABLE roast_outcomes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE roast_curves ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ai_coaching ENABLE ROW LEVEL SECURITY;
    """)
    
    # Create RLS policies
    migrations.append("""
    CREATE POLICY "Users can view their own roast outcomes" ON roast_outcomes
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own roast outcomes" ON roast_outcomes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own roast outcomes" ON roast_outcomes
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can view their own roast curves" ON roast_curves
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own roast curves" ON roast_curves
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own roast curves" ON roast_curves
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can view their own AI coaching" ON ai_coaching
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own AI coaching" ON ai_coaching
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own AI coaching" ON ai_coaching
        FOR UPDATE USING (auth.uid() = user_id);
    """)
    
    return migrations
