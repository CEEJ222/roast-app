"""
AI-Powered Bean Profile API Endpoints
Replaces HTML parsing with AI analysis and vector database search
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from ai_bean_analyzer import get_ai_analyzer
from main import get_supabase, verify_jwt_token

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for AI bean analysis
class AIBeanAnalysisRequest(BaseModel):
    description: str
    name: Optional[str] = None
    supplier_url: Optional[str] = None
    supplier_name: Optional[str] = None

class AIBeanAnalysisResponse(BaseModel):
    success: bool
    bean_profile: Dict[str, Any]
    similar_beans: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    error: Optional[str] = None

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 10

class SemanticSearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    total_found: int

# AI Bean Analysis Endpoints
@router.post("/ai/analyze-bean", response_model=AIBeanAnalysisResponse)
async def analyze_bean_with_ai(
    request: AIBeanAnalysisRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Analyze a bean description using AI and vector similarity
    """
    try:
        analyzer = get_ai_analyzer()
        
        # Analyze the bean description
        result = analyzer.analyze_bean_description(request.description, user_id)
        
        if result["success"]:
            # Update with provided name if available
            if request.name:
                result["bean_profile"]["name"] = request.name
            
            if request.supplier_url:
                result["bean_profile"]["supplier_url"] = request.supplier_url
            
            if request.supplier_name:
                result["bean_profile"]["supplier_name"] = request.supplier_name
            
            return AIBeanAnalysisResponse(
                success=True,
                bean_profile=result["bean_profile"],
                similar_beans=result["bean_profile"].get("similar_beans", []),
                recommendations=result["bean_profile"].get("recommendations", [])
            )
        else:
            return AIBeanAnalysisResponse(
                success=False,
                bean_profile=result["bean_profile"],
                error=result.get("error", "Analysis failed")
            )
            
    except Exception as e:
        logger.error(f"AI bean analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/semantic-search", response_model=SemanticSearchResponse)
async def semantic_search_beans(
    request: SemanticSearchRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Search for beans using semantic similarity
    """
    try:
        analyzer = get_ai_analyzer()
        
        # Search for similar beans
        results = analyzer.weaviate.search_beans_semantic(request.query, request.limit)
        
        # Filter results by user_id if needed
        user_results = [bean for bean in results if bean.get("user_id") == user_id]
        
        return SemanticSearchResponse(
            success=True,
            results=user_results,
            total_found=len(user_results)
        )
        
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/similar-beans/{bean_profile_id}")
async def find_similar_beans(
    bean_profile_id: str,
    limit: int = 5,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Find similar beans based on a specific bean profile
    """
    try:
        sb = get_supabase()
        
        # Get the bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Find similar beans
        analyzer = get_ai_analyzer()
        similar_beans = analyzer.weaviate.find_similar_beans(bean_profile, limit)
        
        return {
            "success": True,
            "similar_beans": similar_beans,
            "total_found": len(similar_beans)
        }
        
    except Exception as e:
        logger.error(f"Find similar beans error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/create-bean-profile")
async def create_bean_profile_from_ai(
    request: AIBeanAnalysisRequest,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Create a bean profile using AI analysis and save to database
    """
    try:
        analyzer = get_ai_analyzer()
        
        # Analyze the bean description
        result = analyzer.analyze_bean_description(request.description, user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Analysis failed"))
        
        bean_profile = result["bean_profile"]
        
        # Update with provided information
        if request.name:
            bean_profile["name"] = request.name
        if request.supplier_url:
            bean_profile["supplier_url"] = request.supplier_url
        if request.supplier_name:
            bean_profile["supplier_name"] = request.supplier_name
        
        # Save to database
        sb = get_supabase()
        
        # Remove fields that shouldn't be saved to database
        db_profile = {k: v for k, v in bean_profile.items() if k not in ["similar_beans", "recommendations", "ai_generated"]}
        
        result = sb.table("bean_profiles").insert(db_profile).execute()
        
        if result.data:
            bean_id = result.data[0]["id"]
            
            # Sync to Weaviate for semantic search
            analyzer.weaviate.sync_bean_profile(result.data[0])
            
            return {
                "success": True,
                "bean_profile_id": bean_id,
                "bean_profile": result.data[0],
                "similar_beans": bean_profile.get("similar_beans", []),
                "recommendations": bean_profile.get("recommendations", [])
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save bean profile")
            
    except Exception as e:
        logger.error(f"Create bean profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/bean-recommendations/{bean_profile_id}")
async def get_bean_recommendations(
    bean_profile_id: str,
    user_id: str = Depends(verify_jwt_token)
):
    """
    Get AI-powered recommendations for a bean profile
    """
    try:
        sb = get_supabase()
        
        # Get the bean profile
        bean_result = sb.table("bean_profiles").select("*").eq("id", bean_profile_id).eq("user_id", user_id).execute()
        if not bean_result.data:
            raise HTTPException(status_code=404, detail="Bean profile not found")
        
        bean_profile = bean_result.data[0]
        
        # Get similar beans for recommendations
        analyzer = get_ai_analyzer()
        similar_beans = analyzer.weaviate.find_similar_beans(bean_profile, limit=5)
        
        # Generate recommendations
        recommendations = analyzer._generate_recommendations(similar_beans)
        
        # Get roast profile recommendations
        roast_recommendation = analyzer.weaviate.recommend_roast_profile(bean_profile)
        
        return {
            "success": True,
            "bean_profile": bean_profile,
            "similar_beans": similar_beans,
            "recommendations": recommendations,
            "roast_recommendation": roast_recommendation
        }
        
    except Exception as e:
        logger.error(f"Get bean recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/bean-insights/{user_id}")
async def get_user_bean_insights(
    user_id: str = Depends(verify_jwt_token),
    limit: int = 20
):
    """
    Get AI insights about user's bean collection
    """
    try:
        sb = get_supabase()
        
        # Get user's bean profiles
        bean_result = sb.table("bean_profiles").select("*").eq("user_id", user_id).limit(limit).execute()
        
        if not bean_result.data:
            return {
                "success": True,
                "insights": {
                    "total_beans": 0,
                    "message": "No beans found. Start by adding your first bean profile!"
                }
            }
        
        beans = bean_result.data
        analyzer = get_ai_analyzer()
        
        # Analyze collection
        origins = [bean.get("origin") for bean in beans if bean.get("origin")]
        varieties = [bean.get("variety") for bean in beans if bean.get("variety")]
        processes = [bean.get("process_method") for bean in beans if bean.get("process_method")]
        
        # Get most common characteristics
        from collections import Counter
        origin_counts = Counter(origins)
        variety_counts = Counter(varieties)
        process_counts = Counter(processes)
        
        insights = {
            "total_beans": len(beans),
            "most_common_origin": origin_counts.most_common(1)[0] if origin_counts else None,
            "most_common_variety": variety_counts.most_common(1)[0] if variety_counts else None,
            "most_common_process": process_counts.most_common(1)[0] if process_counts else None,
            "origin_diversity": len(set(origins)),
            "variety_diversity": len(set(varieties)),
            "process_diversity": len(set(processes)),
            "recommendations": []
        }
        
        # Generate recommendations based on collection
        if len(beans) < 5:
            insights["recommendations"].append("Try adding more bean profiles to get better AI recommendations")
        
        if len(set(origins)) < 3:
            insights["recommendations"].append("Explore beans from different origins for variety")
        
        if len(set(processes)) < 2:
            insights["recommendations"].append("Try beans with different processing methods")
        
        return {
            "success": True,
            "insights": insights,
            "beans": beans
        }
        
    except Exception as e:
        logger.error(f"Get bean insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
