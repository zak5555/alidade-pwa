#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const targetFile = positionalArgs[0] || 'app.js';
const outputJson = process.argv.includes('--json');

const resolved = path.resolve(process.cwd(), targetFile);
if (!fs.existsSync(resolved)) {
    console.error(`[audit-app-contract] File not found: ${resolved}`);
    process.exit(1);
}

const source = fs.readFileSync(resolved, 'utf8');
const lines = source.split(/\r?\n/);

const declarations = [];
const windowExports = [];
const windowEvents = [];
const documentEvents = [];

const classRe = /^class\s+([A-Za-z0-9_]+)/;
const fnRe = /^(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/;
const windowSetRe = /^window\.([A-Za-z0-9_]+)\s*=/;
const windowEventRe = /^window\.addEventListener\(\s*['"`]([^'"`]+)['"`]/;
const documentEventRe = /^document\.addEventListener\(\s*['"`]([^'"`]+)['"`]/;

for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = lines[i].trim();

    const classMatch = line.match(classRe);
    if (classMatch) {
        declarations.push({ type: 'class', name: classMatch[1], line: lineNo });
    }

    const fnMatch = line.match(fnRe);
    if (fnMatch) {
        declarations.push({ type: 'function', name: fnMatch[1], line: lineNo });
    }

    const windowSetMatch = line.match(windowSetRe);
    if (windowSetMatch) {
        windowExports.push({ name: windowSetMatch[1], line: lineNo });
    }

    const windowEventMatch = line.match(windowEventRe);
    if (windowEventMatch) {
        windowEvents.push({ event: windowEventMatch[1], line: lineNo });
    }

    const documentEventMatch = line.match(documentEventRe);
    if (documentEventMatch) {
        documentEvents.push({ event: documentEventMatch[1], line: lineNo });
    }
}

const byName = new Map();
for (const decl of declarations) {
    const list = byName.get(decl.name) || [];
    list.push(decl);
    byName.set(decl.name, list);
}

const duplicates = [...byName.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([name, list]) => ({ name, occurrences: list }))
    .sort((a, b) => b.occurrences.length - a.occurrences.length || a.name.localeCompare(b.name));

const uniqueWindowExportNames = [...new Set(windowExports.map((item) => item.name))].sort((a, b) => a.localeCompare(b));
const windowEventsByType = windowEvents.reduce((acc, item) => {
    acc[item.event] = (acc[item.event] || 0) + 1;
    return acc;
}, {});
const documentEventsByType = documentEvents.reduce((acc, item) => {
    acc[item.event] = (acc[item.event] || 0) + 1;
    return acc;
}, {});

const report = {
    generated_at: new Date().toISOString(),
    file: path.relative(process.cwd(), resolved),
    metrics: {
        line_count: lines.length,
        char_count: source.length,
        declaration_count: declarations.length,
        class_count: declarations.filter((d) => d.type === 'class').length,
        function_count: declarations.filter((d) => d.type === 'function').length,
        window_export_count: windowExports.length,
        window_export_unique_count: uniqueWindowExportNames.length,
        duplicate_declaration_count: duplicates.length
    },
    duplicate_declarations: duplicates,
    window_contract: {
        exports: windowExports,
        unique_export_names: uniqueWindowExportNames
    },
    listeners: {
        window: windowEvents,
        document: documentEvents,
        window_by_type: windowEventsByType,
        document_by_type: documentEventsByType
    }
};

if (outputJson) {
    process.stdout.write(JSON.stringify(report, null, 2));
    process.stdout.write('\n');
    process.exit(0);
}

console.log('ALIDADE app.js contract audit');
console.log(`- File: ${report.file}`);
console.log(`- Lines: ${report.metrics.line_count}`);
console.log(`- Chars: ${report.metrics.char_count}`);
console.log(`- Declarations: ${report.metrics.declaration_count} (classes: ${report.metrics.class_count}, functions: ${report.metrics.function_count})`);
console.log(`- Window exports: ${report.metrics.window_export_count} (unique names: ${report.metrics.window_export_unique_count})`);
console.log(`- Duplicate declaration names: ${report.metrics.duplicate_declaration_count}`);

if (duplicates.length > 0) {
    console.log('- Duplicate declarations:');
    for (const dup of duplicates) {
        const points = dup.occurrences.map((item) => `${item.type}@${item.line}`).join(', ');
        console.log(`  - ${dup.name}: ${points}`);
    }
}

console.log('- Window listeners by event:');
for (const [eventName, count] of Object.entries(windowEventsByType)) {
    console.log(`  - ${eventName}: ${count}`);
}

console.log('- Document listeners by event:');
for (const [eventName, count] of Object.entries(documentEventsByType)) {
    console.log(`  - ${eventName}: ${count}`);
}
