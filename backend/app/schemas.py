from datetime import date
from pydantic import BaseModel

class LearningTaskBase(BaseModel):
    date: date
    stack: str
    topic: str
    planned_hours: float = 0.0
    actual_hours: float = 0.0
    completed: bool = False

class LearningTaskCreate(LearningTaskBase):
    pass

class LearningTaskUpdate(BaseModel):
    stack: str | None = None
    topic: str | None = None
    planned_hours: float | None = None
    actual_hours: float | None = None
    completed: bool | None = None

class LearningTask(LearningTaskBase):
    id: int

    class Config:
        from_attributes = True
