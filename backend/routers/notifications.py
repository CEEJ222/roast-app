from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import asyncio
from ..utils.auth import get_current_user
from ..utils.database import get_db_connection

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Pydantic models for request/response
class NotificationRequest(BaseModel):
    title: str
    body: str
    audience: str = "all"
    scheduled_time: Optional[datetime] = None
    template: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class NotificationTemplate(BaseModel):
    id: str
    name: str
    title: str
    body: str
    icon: str
    category: str

class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    audience: str
    sent_at: datetime
    status: str
    delivery_rate: float
    open_rate: float

class DeviceToken(BaseModel):
    user_id: str
    token: str
    platform: str  # 'ios', 'android', 'web'
    created_at: datetime
    last_used: datetime

# In-memory storage for demo (replace with database in production)
notification_templates = [
    {
        "id": "roast-milestone",
        "name": "Roast Milestone",
        "title": "Roast Milestone Reached",
        "body": "Your roast has reached the {milestone} phase",
        "icon": "🔥",
        "category": "roast"
    },
    {
        "id": "roast-complete",
        "name": "Roast Complete",
        "title": "Roast Finished!",
        "body": "Your {roastLevel} roast is complete and ready for cooling",
        "icon": "✅",
        "category": "roast"
    },
    {
        "id": "bean-profile-tip",
        "name": "Bean Profile Tip",
        "title": "Pro Tip",
        "body": "Did you know {beanOrigin} beans typically perform best at {temperature}°F?",
        "icon": "💡",
        "category": "education"
    },
    {
        "id": "app-update",
        "name": "App Update",
        "title": "New Features Available",
        "body": "Check out the latest improvements to your roasting experience",
        "icon": "🚀",
        "category": "app"
    }
]

# Mock notification history (replace with database queries)
notification_history = []

@router.get("/templates", response_model=List[NotificationTemplate])
async def get_notification_templates():
    """Get all available notification templates"""
    return notification_templates

@router.get("/history", response_model=List[NotificationResponse])
async def get_notification_history(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get notification history with pagination"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return notification_history[offset:offset + limit]

@router.post("/send")
async def send_notification(
    notification: NotificationRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send a push notification to specified audience"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # If scheduled for later, add to background tasks
        if notification.scheduled_time and notification.scheduled_time > datetime.now():
            # Schedule notification for later
            delay_seconds = (notification.scheduled_time - datetime.now()).total_seconds()
            background_tasks.add_task(
                send_scheduled_notification,
                notification,
                delay_seconds
            )
            return {"message": "Notification scheduled successfully", "scheduled_for": notification.scheduled_time}
        else:
            # Send immediately
            result = await send_push_notification(notification)
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")

@router.post("/templates", response_model=NotificationTemplate)
async def create_notification_template(
    template: NotificationTemplate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification template"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Add to templates list
    template_dict = template.dict()
    notification_templates.append(template_dict)
    
    return template

@router.put("/templates/{template_id}")
async def update_notification_template(
    template_id: str,
    template: NotificationTemplate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing notification template"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find and update template
    for i, t in enumerate(notification_templates):
        if t["id"] == template_id:
            notification_templates[i] = template.dict()
            return {"message": "Template updated successfully"}
    
    raise HTTPException(status_code=404, detail="Template not found")

@router.delete("/templates/{template_id}")
async def delete_notification_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification template"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find and remove template
    for i, t in enumerate(notification_templates):
        if t["id"] == template_id:
            del notification_templates[i]
            return {"message": "Template deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Template not found")

@router.post("/device-tokens")
async def register_device_token(
    token_data: DeviceToken,
    current_user: dict = Depends(get_current_user)
):
    """Register a device token for push notifications"""
    try:
        # In production, store in database
        # For now, just return success
        return {"message": "Device token registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register device token: {str(e)}")

@router.get("/analytics")
async def get_notification_analytics(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get notification analytics and metrics"""
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Mock analytics data (replace with real database queries)
    analytics = {
        "total_sent": len(notification_history),
        "delivery_rate": 94.2,
        "open_rate": 67.8,
        "platform_breakdown": {
            "ios": {"sent": 450, "delivered": 425, "opened": 289},
            "android": {"sent": 380, "delivered": 358, "opened": 243},
            "web": {"sent": 120, "delivered": 115, "opened": 78}
        },
        "top_templates": [
            {"template": "roast-milestone", "sent": 150, "open_rate": 72.3},
            {"template": "roast-complete", "sent": 120, "open_rate": 68.5},
            {"template": "bean-profile-tip", "sent": 80, "open_rate": 45.2}
        ]
    }
    
    return analytics

async def send_push_notification(notification: NotificationRequest) -> dict:
    """Send push notification to devices"""
    try:
        # Get target audience tokens
        device_tokens = await get_device_tokens_for_audience(notification.audience)
        
        if not device_tokens:
            return {"message": "No devices found for target audience", "sent_count": 0}
        
        # Send to each platform
        ios_tokens = [token for token in device_tokens if token["platform"] == "ios"]
        android_tokens = [token for token in device_tokens if token["platform"] == "android"]
        web_tokens = [token for token in device_tokens if token["platform"] == "web"]
        
        sent_count = 0
        
        # Send to iOS (APNs)
        if ios_tokens:
            ios_result = await send_to_ios(ios_tokens, notification)
            sent_count += ios_result.get("sent", 0)
        
        # Send to Android (FCM)
        if android_tokens:
            android_result = await send_to_android(android_tokens, notification)
            sent_count += android_result.get("sent", 0)
        
        # Send to Web (Web Push)
        if web_tokens:
            web_result = await send_to_web(web_tokens, notification)
            sent_count += web_result.get("sent", 0)
        
        # Store notification in history
        notification_record = {
            "id": len(notification_history) + 1,
            "title": notification.title,
            "body": notification.body,
            "audience": notification.audience,
            "sent_at": datetime.now(),
            "status": "delivered",
            "delivery_rate": 94.2,
            "open_rate": 67.8
        }
        notification_history.insert(0, notification_record)
        
        return {
            "message": "Notification sent successfully",
            "sent_count": sent_count,
            "target_audience": notification.audience
        }
        
    except Exception as e:
        raise Exception(f"Failed to send push notification: {str(e)}")

async def get_device_tokens_for_audience(audience: str) -> List[Dict]:
    """Get device tokens for target audience"""
    # Mock implementation - replace with database query
    mock_tokens = [
        {"user_id": "user1", "token": "ios_token_1", "platform": "ios"},
        {"user_id": "user2", "token": "android_token_1", "platform": "android"},
        {"user_id": "user3", "token": "web_token_1", "platform": "web"},
        {"user_id": "user4", "token": "ios_token_2", "platform": "ios"},
        {"user_id": "user5", "token": "android_token_2", "platform": "android"},
    ]
    
    # Filter by audience (simplified logic)
    if audience == "all":
        return mock_tokens
    elif audience == "ios-users":
        return [token for token in mock_tokens if token["platform"] == "ios"]
    elif audience == "android-users":
        return [token for token in mock_tokens if token["platform"] == "android"]
    elif audience == "web-users":
        return [token for token in mock_tokens if token["platform"] == "web"]
    else:
        return mock_tokens

async def send_to_ios(tokens: List[Dict], notification: NotificationRequest) -> Dict:
    """Send notification to iOS devices via APNs"""
    # TODO: Implement actual APNs integration
    # For now, return mock success
    return {"sent": len(tokens), "failed": 0}

async def send_to_android(tokens: List[Dict], notification: NotificationRequest) -> Dict:
    """Send notification to Android devices via FCM"""
    # TODO: Implement actual FCM integration
    # For now, return mock success
    return {"sent": len(tokens), "failed": 0}

async def send_to_web(tokens: List[Dict], notification: NotificationRequest) -> Dict:
    """Send notification to Web browsers via Web Push API"""
    # TODO: Implement actual Web Push integration
    # For now, return mock success
    return {"sent": len(tokens), "failed": 0}

async def send_scheduled_notification(notification: NotificationRequest, delay_seconds: float):
    """Send a scheduled notification after delay"""
    await asyncio.sleep(delay_seconds)
    await send_push_notification(notification)
