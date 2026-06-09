from sqlalchemy import Column, Integer, String, Boolean, Float, Date
from sqlalchemy.orm import relationship
from .database import Base

class LearningTask(Base):
    __tablename__ = 'learning_tasks'

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    stack = Column(String(128), nullable=False)
    topic = Column(String(256), nullable=False)
    planned_hours = Column(Float, default=0.0)
    actual_hours = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)

