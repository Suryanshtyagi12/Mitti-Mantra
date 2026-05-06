"""
Database Models
SQLAlchemy ORM models for users and predictions
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    crop_predictions = relationship("CropPrediction", back_populates="user", cascade="all, delete-orphan")
    disease_predictions = relationship("DiseasePrediction", back_populates="user", cascade="all, delete-orphan")
    irrigation_schedules = relationship("IrrigationSchedule", back_populates="user", cascade="all, delete-orphan")


class CropPrediction(Base):
    """Model to store crop recommendation predictions"""
    __tablename__ = "crop_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Input features
    nitrogen = Column(Float)
    phosphorus = Column(Float)
    potassium = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    ph = Column(Float)
    rainfall = Column(Float)
    
    # Prediction results
    recommended_crop = Column(String)
    confidence = Column(Float, nullable=True)
    alternative_crops = Column(Text, nullable=True)  # JSON string
    reasoning = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="crop_predictions")


class DiseasePrediction(Base):
    """Model to store disease detection predictions"""
    __tablename__ = "disease_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Prediction results
    disease = Column(String)
    confidence = Column(Float)
    severity = Column(String, nullable=True)
    affected_plant = Column(String, nullable=True)
    
    # Image metadata (optional)
    image_path = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="disease_predictions")


class IrrigationSchedule(Base):
    """Model to store irrigation schedules"""
    __tablename__ = "irrigation_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Input features
    crop_type = Column(String)
    soil_moisture = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    crop_stage = Column(String)
    
    # Prediction results
    irrigation_needed = Column(Boolean)
    water_amount = Column(Float)
    schedule = Column(Text)
    next_irrigation = Column(String)
    reasoning = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="irrigation_schedules")

