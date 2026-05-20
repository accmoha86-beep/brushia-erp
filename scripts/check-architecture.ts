/**
 * Architecture Rule Checker
 * Ensures domain boundaries are respected in the codebase.
 * Run: npx tsx scripts/check-architecture.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const MODULES_DIR = path.join(__dirname, '..', 'apps', 'api', 'src', 'modules');

// Domain → allowed imports
const ALLOWED_IMPORTS: Record<string, string[]> = {
  'catalog': ['@brushia/shared', '@brushia/db'],
  'inventory': ['@brushia/shared', '@brushia/db', '../catalog'],  // Via contract only
  'accounting': ['@brushia/shared', '@brushia/db'],
  'sales': ['@brushia/shared', '@brushia/db'],
  'pos': ['@brushia/shared', '@brushia/db', '../sales'],  // POS orchestrates sales
  'purchasing': ['@brushia/shared', '@brushia/db'],
  'crm': ['@brushia/shared', '@brushia/db'],
  'shipping': ['@brushia/shared', '@brushia/db'],
  'promotions': ['@brushia/shared', '@brushia/db'],
  'hr': ['@brushia/shared', '@brushia/db'],
  'exhibitions': ['@brushia/shared', '@brushia/db'],
  'whatsapp': ['@brushia/shared', '@brushia/db'],
  'settings': ['@brushia/shared', '@brushia/db'],
};

// Direct SQL cross-schema access is FORBIDDEN
const FORBIDDEN_PATTERNS = [
  // No module should directly reference another module's schema in SQL
  { pattern: /FROM\s+(catalog|inventory|accounting|sales|pos|purchasing|crm|shipping)\./i, message: 'Direct cross-schema SQL detected' },
  // No module should import another module's repository
  { pattern: /from\s+['"]\.\.\/(?!common)[a-z]+\/[a-z]+\.repository/i, message: 'Cross-module repository import' },
];

interface Violation {
  file: string;
  line: number;
  rule: string;
  detail: string;
}

function checkModule(moduleName: string): Violation[] {
  const violations: Violation[] = [];
  const moduleDir = path.join(MODULES_DIR, moduleName);
  
  if (!fs.existsSync(moduleDir)) return violations;
  
  const files = getAllFiles(moduleDir);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      for (const forbidden of FORBIDDEN_PATTERNS) {
        if (forbidden.pattern.test(line)) {
          violations.push({
            file: path.relative(MODULES_DIR, file),
            line: idx + 1,
            rule: forbidden.message,
            detail: line.trim(),
          });
        }
      }
    });
  }
  
  return violations;
}

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Run
console.log('🏗️  Checking architecture rules...\n');

let totalViolations = 0;

for (const moduleName of Object.keys(ALLOWED_IMPORTS)) {
  const violations = checkModule(moduleName);
  if (violations.length > 0) {
    console.log(`❌ ${moduleName}: ${violations.length} violation(s)`);
    for (const v of violations) {
      console.log(`   ${v.file}:${v.line} — ${v.rule}`);
      console.log(`   ${v.detail}\n`);
    }
    totalViolations += violations.length;
  } else {
    console.log(`✅ ${moduleName}: clean`);
  }
}

console.log(`\n${'═'.repeat(50)}`);
if (totalViolations === 0) {
  console.log('✅ All architecture rules passed!');
  process.exit(0);
} else {
  console.log(`❌ ${totalViolations} violation(s) found!`);
  process.exit(1);
}
