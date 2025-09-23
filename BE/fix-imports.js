import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Add .js to relative imports that don't already have extensions
  let fixed = content.replace(/from ["'](\.\/.+?)["'];/g, (match, importPath) => {
    if (importPath.endsWith('.js')) return match;
    return `from "${importPath}.js";`;
  });
  
  fixed = fixed.replace(/from ["'](\.\.\/.+?)["'];/g, (match, importPath) => {
    if (importPath.endsWith('.js')) return match;
    return `from "${importPath}.js";`;
  });
  
  // Fix any double .js.js extensions
  fixed = fixed.replace(/\.js\.js"/g, '.js"');
  
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function fixImportsInDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixImportsInDirectory(fullPath);
    } else if (file.name.endsWith('.js')) {
      fixImportsInFile(fullPath);
    }
  }
}

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Fixing ES module imports...');
  fixImportsInDirectory(distPath);
  console.log('Import fixing complete!');
} else {
  console.log('dist directory not found');
}
