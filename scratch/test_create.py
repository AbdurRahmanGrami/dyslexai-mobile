import sys
import os
import uuid
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.routers.assignments import create_assignment, AssignmentCreate, CustomExercise

db = SessionLocal()
try:
    # We need a valid teacher and student. We will use dummy UUID for student and 1 for teacher.
    # To be safe, let's create a student first in the DB.
    from app.models.student import Student
    test_student = Student(name="Test Student", age=10)
    db.add(test_student)
    db.commit()
    db.refresh(test_student)
    print(f"Test student ID: {test_student.id}")

    # Now create assignment
    payload = AssignmentCreate(
        teacher_id=1,
        student_id=test_student.id,
        title="Test Custom",
        mode="custom",
        custom_exercises=[
            CustomExercise(
                type="word_typing",
                content="hello",
                expected="hello",
                target_words=["hello"],
                difficulty=1
            )
        ]
    )
    res = create_assignment(payload=payload, db=db)
    print("Success:", res)

except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
