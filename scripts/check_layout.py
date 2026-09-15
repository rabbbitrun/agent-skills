#!/usr/bin/env python3
"""Validate tracked repository paths without third-party dependencies."""

from pathlib import Path, PurePosixPath
import re
import subprocess
import sys


CATEGORIES = {"product", "design", "engineering", "data", "productivity"}
ROOT_FILES = {"README.md", "AGENTS.md", ".gitignore", "LICENSE"}
ADMIN_FILES = {"scripts/check_layout.py", ".github/workflows/validate-layout.yml"}
NAME = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


def validate(root, paths):
    errors = []
    skills = set()
    names = {}
    for path in sorted(paths):
        if path in ROOT_FILES or path in ADMIN_FILES:
            continue
        parts = PurePosixPath(path).parts
        if len(parts) < 4 or parts[0] != "skills":
            errors.append(f"{path}: use skills/<category>/<skill-name>/")
            continue
        category, name = parts[1:3]
        if category not in CATEGORIES:
            errors.append(f"{path}: unknown category {category!r}")
        if not NAME.fullmatch(name):
            errors.append(f"{path}: skill directory must use lowercase kebab-case")
        skill = "/".join(parts[:3])
        if name in names and names[name] != skill:
            errors.append(f"{path}: duplicate skill name also in {names[name]}")
        names[name] = skill
        skills.add(skill)

    readme = (root / "README.md").read_text() if (root / "README.md").is_file() else ""
    for skill in sorted(skills):
        manifest = f"{skill}/SKILL.md"
        if manifest not in paths or not (root / manifest).is_file():
            errors.append(f"{skill}: missing tracked SKILL.md")
            continue
        content = (root / manifest).read_text()
        frontmatter = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", content, re.S)
        field = re.search(r"^name:\s*([^\r\n]+)$", frontmatter[1], re.M) if frontmatter else None
        if not field or field[1].strip().strip("\"'") != skill.split("/")[-1]:
            errors.append(f"{manifest}: frontmatter name must match directory")
        if f"]({manifest})" not in readme:
            errors.append(f"{skill}: missing README catalog link")

    if not skills:
        errors.append("No categorized skills found")
    return errors


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        ["git", "ls-files", "-z"], cwd=root, check=True, capture_output=True
    )
    paths = set(result.stdout.decode().rstrip("\0").split("\0")) - {""}
    errors = validate(root, paths)
    if errors:
        print("Repository layout failed:\n" + "\n".join(f"- {error}" for error in errors))
        sys.exit(1)
    print(f"Repository layout valid ({len(paths)} tracked files)")
