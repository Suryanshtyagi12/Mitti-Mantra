from sqlalchemy.orm import Session
from datetime import datetime, date
from app.db_models import TrackFarming, FarmingAdvice
from app.ai_core.prompt_manager import load_prompt
from app.ai_core.tracking_logic import calculate_crop_age, get_crop_stage, get_mock_weather
from app.services.ai_orchestrator import ai_orchestrator
import json

class TrackFarmingService:
    def create_record(self, db: Session, user_id: int, data: dict):
        """Create a new farming record"""
        # Deactivate previous active records? 
        # For now assuming one active per user or just adding new.
        # User request: "Store data per USER ID"
        
        # Check if record exists for this crop?? 
        # Let's just add new.
        
        record = TrackFarming(
            user_id=user_id,
            crop_name=data.get("crop_name"),
            location=data.get("location"),
            soil_type=data.get("soil_type"),
            fertilizer=data.get("fertilizer"),
            planting_date=datetime.strptime(data.get("plantation_date"), "%Y-%m-%d"),
            language="en" # Default, can be updated
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_records(self, db: Session, user_id: int):
        return db.query(TrackFarming).filter(TrackFarming.user_id == user_id).order_by(TrackFarming.created_at.desc()).all()

    def get_advice(self, db: Session, record_id: int, language: str = "en"):
        record = db.query(TrackFarming).filter(TrackFarming.id == record_id).first()
        if not record:
            return None

        # Logic from Crop AI 'Track Farming' mode
        p_date = record.planting_date
        age_days = calculate_crop_age(p_date)
        current_stage = get_crop_stage(record.crop_name, age_days)
        weather = get_mock_weather(record.location) # Mock for now per Crop AI
        
        # Construct Prompt
        prompt_template = load_prompt("tracking_prompt.txt")
        prompt = prompt_template.format(
            crop_name=record.crop_name,
            plantation_date=p_date.strftime("%Y-%m-%d"),
            age=age_days,
            stage=current_stage,
            location=record.location,
            soil_type=record.soil_type,
            fertilizer=record.fertilizer,
            weather=f"{weather['temp']}, {weather['condition']}, {weather['forecast']}"
        )
        
        # System Prompt
        sys_template = load_prompt("system_prompt.txt")
        
        # Get AI Response
        advice_text = ai_orchestrator.get_llm_response(
            prompt=prompt,
            system_prompt=sys_template,
            language=language
        )
        
        # Save History
        history = FarmingAdvice(
            track_farming_id=record.id,
            advice_text=advice_text
        )
        db.add(history)
        # Update last advice date
        record.last_advice_date = datetime.now()
        db.commit()
        
        return {
            "record": {
                "crop_name": record.crop_name,
                "location": record.location,
                "stage": current_stage,
                "age_days": age_days,
                "planting_date": record.planting_date.strftime("%Y-%m-%d")
            },
            "weather": weather,
            "advice": advice_text
        }

track_farming_service = TrackFarmingService()
