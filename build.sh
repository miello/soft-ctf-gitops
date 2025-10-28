#!/bin/bash

set -e

CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

echo "Cleanup the old files"
rm -rf dist out

echo "Compiling to YAML file"
pnpm compile
pnpm synth

echo "Cleanup the temporary files"
rm -rf out
