#!/bin/bash

# Generate a secure JWT secret
echo "🔐 Generating a secure JWT secret..."
echo ""

# Generate random string
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

echo "Your JWT_SECRET:"
echo "================"
echo "$JWT_SECRET"
echo ""
echo "Copy this value and use it in your Railway environment variables!"
echo ""
echo "Variable name: JWT_SECRET"
echo "Variable value: $JWT_SECRET"
