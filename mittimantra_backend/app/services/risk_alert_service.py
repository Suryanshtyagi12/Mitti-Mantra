import logging
from datetime import datetime
from typing import List, Dict, Any
from .track_farming_service import track_farming_service
from app.db_models import TrackFarming

logger = logging.getLogger(__name__)

class RiskAlertService:
    def __init__(self):
        pass

    def get_risk_alerts(self, user_id: int, db) -> List[Dict[str, Any]]:
        """
        Get risk alerts for the user's crops based on season.
        """
        try:
            # 1. Get user's active crops
            # For simplicity, getting all records, ideally filter active ones
            user_crops = track_farming_service.get_user_records(db, user_id)
            
            alerts = []
            
            # 2. Determine current season/month
            current_month = datetime.now().month
            
            # Simple seasonal logic (India centric)
            season = "unknown"
            if 6 <= current_month <= 9:
                season = "monsoon"
            elif 10 <= current_month <= 3: # Oct to March
                season = "winter" # Rabi
            else:
                season = "summer" # Zaid (April-May)

            # 3. Generate alerts per crop
            for crop_record in user_crops:
                crop_name = crop_record.crop_name.lower()
                crop_alerts = self._generate_crop_specific_alerts(crop_name, season)
                if crop_alerts:
                    for alert in crop_alerts:
                        # Deduplicate
                        if alert not in alerts:
                            alerts.append(alert)
                            
            # 4. General alerts if no crops or just general advice
            general_alerts = self._generate_general_alerts(season)
            for alert in general_alerts:
                 if alert not in alerts:
                    alerts.append(alert)
                    
            return alerts
            
        except Exception as e:
            logger.error(f"Error generating risk alerts: {str(e)}")
            return [{"type": "info", "message": "Unable to fetch risk alerts at the moment."}]

    def _generate_crop_specific_alerts(self, crop_name: str, season: str) -> List[Dict[str, Any]]:
        """
        Generate mock alerts for specific crops based on season.
        """
        alerts = []
        
        if crop_name == "rice":
            if season == "monsoon":
                alerts.append({
                    "crop": "Rice",
                    "type": "warning",
                    "message": "Heavy rainfall expected. Ensure proper drainage to prevent waterlogging."
                })
                alerts.append({
                    "crop": "Rice",
                    "type": "pest",
                    "message": "Watch out for Stem Borer attacks in humid conditions."
                })
        elif crop_name == "wheat":
            if season == "winter":
                alerts.append({
                    "crop": "Wheat",
                    "type": "disease",
                    "message": "Cool conditions favor Yellow Rust. Monitor leaves for yellow stripes."
                })
        elif crop_name == "tomato":
            if season == "monsoon":
                alerts.append({
                    "crop": "Tomato",
                    "type": "disease",
                    "message": "High humidity increases risk of Late Blight. Use preventive fungicide."
                })
        
        return alerts

    def _generate_general_alerts(self, season: str) -> List[Dict[str, Any]]:
        """
        Generate general seasonal alerts.
        """
        alerts = []
        if season == "monsoon":
            alerts.append({
                "type": "weather",
                "message": "Monsoon season is active. Keep drainage channels clean."
            })
        elif season == "winter":
            alerts.append({
                "type": "weather",
                "message": "Temperature dropping at night. Protect sensitive crops from frost."
            })
        elif season == "summer":
            alerts.append({
                "type": "weather",
                "message": "Heatwave likely. Ensure adequate irrigation for all crops."
            })
            
        return alerts

risk_alert_service = RiskAlertService()
