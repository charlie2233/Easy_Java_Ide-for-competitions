#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: ./run.sh p01 [input-file]"
  exit 1
fi

PROBLEM_DIR="$1"
SOURCE_DIR="$ROOT_DIR/$PROBLEM_DIR"
SOURCE_FILE="$SOURCE_DIR/Main.java"
BUILD_DIR="$ROOT_DIR/.build/$PROBLEM_DIR"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "Problem file not found: $SOURCE_FILE"
  exit 1
fi

mkdir -p "$BUILD_DIR"

echo "Compiling $PROBLEM_DIR/Main.java"
javac -d "$BUILD_DIR" "$SOURCE_FILE"

if [[ $# -ge 2 ]]; then
  INPUT_FILE="$2"
  echo "Running with input file: $INPUT_FILE"
  java -cp "$BUILD_DIR" Main < "$INPUT_FILE"
elif [[ -f "$SOURCE_DIR/input.txt" ]]; then
  echo "Running with input file: $PROBLEM_DIR/input.txt"
  java -cp "$BUILD_DIR" Main < "$SOURCE_DIR/input.txt"
else
  echo "Running with stdin"
  java -cp "$BUILD_DIR" Main
fi
