#!/bin/bash
echo "Testing missing includeCount=false in app/dashboard/storage/page.tsx"
grep -n "includeCount=false" app/dashboard/storage/page.tsx
