"""Command-line tasks. Create the first admin with:

    python -m app.cli create-admin --email you@example.com --name "Your Name"
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Role, User
from app.security import hash_password


def create_admin(email: str, name: str) -> None:
    password = getpass.getpass("Password (at least 12 characters): ")
    if len(password) < 12:
        sys.exit("Password must be at least 12 characters.")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords don't match.")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email.lower())):
            sys.exit(f"A user with email {email} already exists.")
        db.add(User(email=email.lower(), name=name, role=Role.admin, password_hash=hash_password(password)))
        db.commit()
    print(f"Admin account created for {email}.")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    admin = commands.add_parser("create-admin", help="Create an admin account")
    admin.add_argument("--email", required=True)
    admin.add_argument("--name", required=True)
    args = parser.parse_args()
    if args.command == "create-admin":
        create_admin(args.email, args.name)


if __name__ == "__main__":
    main()
