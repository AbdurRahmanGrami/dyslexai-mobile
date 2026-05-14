import requests
import json
import uuid

# First create a student
res = requests.post("http://localhost:8001/api/students", json={
    "name": "Test Student",
    "age": 10
})
if res.status_code == 200:
    student_id = res.json()["id"]
    print(f"Created student {student_id}")
else:
    print(f"Failed to create student: {res.text}")
    exit(1)

# Now create an assignment for this student
payload = {
    "teacher_id": 1,
    "student_id": student_id,
    "title": "Test Assignment",
    "description": "Test",
    "mode": "custom",
    "custom_exercises": [
        {
            "type": "word_typing",
            "content": "cat",
            "expected": "cat",
            "target_words": ["cat"],
            "difficulty": 1
        }
    ]
}

print("Sending payload:", json.dumps(payload, indent=2))
res = requests.post("http://localhost:8001/api/assignments", json=payload)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
