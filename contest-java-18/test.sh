#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: ./test.sh p01"
  exit 1
fi

PROBLEM_DIR="$1"
SOURCE_DIR="$ROOT_DIR/$PROBLEM_DIR"
MAIN_FILE="$SOURCE_DIR/Main.java"
TEST_FILE="$SOURCE_DIR/MainTest.java"
BUILD_DIR="$ROOT_DIR/.build/${PROBLEM_DIR}-test"

if [[ ! -f "$MAIN_FILE" ]]; then
  echo "Problem file not found: $MAIN_FILE"
  exit 1
fi

if [[ ! -f "$TEST_FILE" ]]; then
  echo "Test file not found: $TEST_FILE"
  exit 1
fi

mkdir -p "$BUILD_DIR"

echo "Compiling $PROBLEM_DIR/Main.java and $PROBLEM_DIR/MainTest.java"
javac -d "$BUILD_DIR" "$MAIN_FILE" "$TEST_FILE"

echo "Running tester in $PROBLEM_DIR"
(
  cd "$SOURCE_DIR"
  java -cp "$BUILD_DIR" MainTest
)
