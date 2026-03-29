"""
TaskFlow - Python Data Generator
================================
This script runs during the APK build process.
It generates seed data (users, default items) that gets
bundled into the Android app.

Technologies: Python 3, JSON

Usage: python generate_data.py
Output: mobile-app/src/seed-data.json
"""

import json
import os
import hashlib
from datetime import datetime


def hash_password(password: str) -> str:
    """Simple password hashing for local storage security."""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_seed_data():
    """Generate the initial data that will be bundled into the app."""

    # Default users
    users = [
        {
            "id": 1,
            "username": "admin",
            "password": hash_password("password123"),
            "role": "admin",
            "created_at": datetime.now().isoformat()
        }
    ]

    # Default sample items to show the app is working
    items = [
        {
            "id": 1,
            "name": "TaskFlow App",
            "description": "Mobile app built with Python + React",
            "status": "Active"
        },
        {
            "id": 2,
            "name": "Python Backend",
            "description": "FastAPI server for data processing",
            "status": "Active"
        },
        {
            "id": 3,
            "name": "Database Setup",
            "description": "SQLite + IndexedDB integration",
            "status": "Pending"
        }
    ]

    # App configuration
    config = {
        "app_name": "TaskFlow",
        "version": "1.0.0",
        "built_with": "Python + React",
        "build_date": datetime.now().isoformat(),
        "features": [
            "Offline CRUD operations",
            "Local IndexedDB storage",
            "Python-generated seed data",
            "Premium dark mode UI"
        ]
    }

    return {
        "users": users,
        "items": items,
        "config": config
    }


def main():
    """Main entry point - generates and saves seed data."""
    print("[Python] Data Generator running...")
    print("=" * 40)

    seed_data = generate_seed_data()

    # Write to mobile-app/src/seed-data.json
    output_dir = os.path.join(os.path.dirname(__file__), "mobile-app", "src")
    output_path = os.path.join(output_dir, "seed-data.json")

    os.makedirs(output_dir, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(seed_data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Generated {len(seed_data['users'])} users")
    print(f"[OK] Generated {len(seed_data['items'])} sample items")
    print(f"[OK] App config: {seed_data['config']['app_name']} v{seed_data['config']['version']}")
    print(f"[OK] Saved to: {output_path}")
    print("=" * 40)
    print("[DONE] Seed data ready for React build!")


if __name__ == "__main__":
    main()
