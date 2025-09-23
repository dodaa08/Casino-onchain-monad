#!/bin/bash
# Fix ES module imports by adding .js extensions

find dist -name "*.js" | while read -r file; do
    # Add .js to relative imports that don't already have extensions
    sed -i 's|from "\./\([^"]*\)";$|from "./\1.js";|g' "$file"
    sed -i 's|from "\.\./\([^"]*\)";$|from "../\1.js";|g' "$file"
    
    # Fix any double .js.js extensions that might occur
    sed -i 's|\.js\.js"|.js"|g' "$file"
done
