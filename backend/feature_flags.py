"""
Feature Flags System for AI Copilot Access Control

This module provides a comprehensive feature flagging system that allows:
- Development mode for AI Copilot
- Beta user access control
- Premium user gating
- Admin control over feature rollout
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FeatureFlagType(Enum):
    """Types of feature flags"""
    DEVELOPMENT = "development"
    BETA = "beta"
    PREMIUM = "premium"
    ADMIN = "admin"

class FeatureFlag:
    """Individual feature flag definition"""
    def __init__(self, name: str, flag_type: FeatureFlagType, description: str, 
                 enabled: bool = False, beta_users: List[str] = None, 
                 admin_users: List[str] = None):
        self.name = name
        self.flag_type = flag_type
        self.description = description
        self.enabled = enabled
        self.beta_users = beta_users or []
        self.admin_users = admin_users or []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

class FeatureFlagManager:
    """Manages feature flags and access control"""
    
    def __init__(self):
        self.flags: Dict[str, FeatureFlag] = {}
        self._initialize_default_flags()
    
    def _initialize_default_flags(self):
        """Initialize default feature flags"""
        # AI Copilot feature flags
        self.flags["ai_copilot_development"] = FeatureFlag(
            name="ai_copilot_development",
            flag_type=FeatureFlagType.DEVELOPMENT,
            description="Enable AI Copilot for development/testing",
            enabled=True,  # Always enabled for development
            admin_users=["admin"]  # Add your admin user IDs here
        )
        
        self.flags["ai_copilot_beta"] = FeatureFlag(
            name="ai_copilot_beta",
            flag_type=FeatureFlagType.BETA,
            description="Enable AI Copilot for beta users",
            enabled=False,  # Disabled by default
            beta_users=[]  # Add beta user IDs here
        )
        
        self.flags["ai_copilot_premium"] = FeatureFlag(
            name="ai_copilot_premium",
            flag_type=FeatureFlagType.PREMIUM,
            description="Enable AI Copilot for premium users",
            enabled=True,  # Enabled for premium users
            beta_users=[]
        )
    
    def is_feature_enabled(self, feature_name: str, user_id: str = None, 
                          user_metadata: Dict[str, Any] = None) -> bool:
        """
        Check if a feature is enabled for a specific user
        
        Args:
            feature_name: Name of the feature flag
            user_id: User ID to check access for
            user_metadata: User metadata (subscription status, etc.)
            
        Returns:
            bool: True if feature is enabled for the user
        """
        if feature_name not in self.flags:
            logger.warning(f"Feature flag '{feature_name}' not found")
            return False
        
        flag = self.flags[feature_name]
        
        # Check if flag is globally enabled
        if not flag.enabled:
            return False
        
        # Development flags are always enabled for admins
        if flag.flag_type == FeatureFlagType.DEVELOPMENT:
            if user_id in flag.admin_users:
                return True
            # Also check if user has admin role in metadata
            if user_metadata and user_metadata.get("role") == "admin":
                return True
            return False
        
        # Beta flags - check beta users list
        if flag.flag_type == FeatureFlagType.BETA:
            if user_id in flag.beta_users:
                return True
            # Also check if user has beta flag in metadata
            if user_metadata and user_metadata.get("beta_access"):
                return True
            return False
        
        # Premium flags - check subscription status
        if flag.flag_type == FeatureFlagType.PREMIUM:
            if not user_metadata:
                return False
            subscription_status = user_metadata.get("subscription_status", "free")
            return subscription_status in ["premium", "pro", "enterprise"]
        
        return False
    
    def get_user_feature_access(self, user_id: str, user_metadata: Dict[str, Any] = None) -> Dict[str, bool]:
        """
        Get all feature access for a user
        
        Args:
            user_id: User ID
            user_metadata: User metadata
            
        Returns:
            Dict of feature names to access status
        """
        access = {}
        for feature_name in self.flags:
            access[feature_name] = self.is_feature_enabled(feature_name, user_id, user_metadata)
        return access
    
    def add_beta_user(self, feature_name: str, user_id: str) -> bool:
        """Add a user to beta access for a feature"""
        if feature_name not in self.flags:
            return False
        
        if user_id not in self.flags[feature_name].beta_users:
            self.flags[feature_name].beta_users.append(user_id)
            self.flags[feature_name].updated_at = datetime.now()
            logger.info(f"Added user {user_id} to beta access for {feature_name}")
        return True
    
    def remove_beta_user(self, feature_name: str, user_id: str) -> bool:
        """Remove a user from beta access for a feature"""
        if feature_name not in self.flags:
            return False
        
        if user_id in self.flags[feature_name].beta_users:
            self.flags[feature_name].beta_users.remove(user_id)
            self.flags[feature_name].updated_at = datetime.now()
            logger.info(f"Removed user {user_id} from beta access for {feature_name}")
        return True
    
    def enable_feature(self, feature_name: str) -> bool:
        """Enable a feature flag globally"""
        if feature_name not in self.flags:
            return False
        
        self.flags[feature_name].enabled = True
        self.flags[feature_name].updated_at = datetime.now()
        logger.info(f"Enabled feature flag: {feature_name}")
        return True
    
    def disable_feature(self, feature_name: str) -> bool:
        """Disable a feature flag globally"""
        if feature_name not in self.flags:
            return False
        
        self.flags[feature_name].enabled = False
        self.flags[feature_name].updated_at = datetime.now()
        logger.info(f"Disabled feature flag: {feature_name}")
        return True
    
    def get_feature_status(self, feature_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed status of a feature flag"""
        if feature_name not in self.flags:
            return None
        
        flag = self.flags[feature_name]
        return {
            "name": flag.name,
            "type": flag.flag_type.value,
            "description": flag.description,
            "enabled": flag.enabled,
            "beta_users": flag.beta_users,
            "admin_users": flag.admin_users,
            "created_at": flag.created_at.isoformat(),
            "updated_at": flag.updated_at.isoformat()
        }
    
    def list_all_features(self) -> List[Dict[str, Any]]:
        """Get status of all feature flags"""
        return [self.get_feature_status(name) for name in self.flags]

# Global feature flag manager instance
feature_manager = FeatureFlagManager()

def check_ai_copilot_access(user_id: str, user_metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Check AI Copilot access for a user
    
    Returns:
        Dict with access information and reasoning
    """
    # Check all AI Copilot related flags
    development_access = feature_manager.is_feature_enabled("ai_copilot_development", user_id, user_metadata)
    beta_access = feature_manager.is_feature_enabled("ai_copilot_beta", user_id, user_metadata)
    premium_access = feature_manager.is_feature_enabled("ai_copilot_premium", user_id, user_metadata)
    
    # Determine overall access
    has_access = development_access or beta_access or premium_access
    
    # Determine access type and reasoning
    access_type = "none"
    reasoning = "No access to AI Copilot"
    
    if development_access:
        access_type = "development"
        reasoning = "Development access granted"
    elif beta_access:
        access_type = "beta"
        reasoning = "Beta user access granted"
    elif premium_access:
        access_type = "premium"
        reasoning = "Premium subscription access granted"
    
    return {
        "has_access": has_access,
        "access_type": access_type,
        "reasoning": reasoning,
        "development_access": development_access,
        "beta_access": beta_access,
        "premium_access": premium_access,
        "subscription_status": user_metadata.get("subscription_status", "free") if user_metadata else "unknown"
    }
