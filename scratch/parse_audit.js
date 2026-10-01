const fs = require('fs');
const audit = JSON.parse(fs.readFileSync('scratch/audit.json', 'utf16le'));

let vulns = [];
if (audit.advisories) {
    vulns = Object.values(audit.advisories);
} else if (audit.vulnerabilities) {
    vulns = Object.values(audit.vulnerabilities);
}

const summary = vulns.map(v => {
    return {
        name: v.module_name || v.name,
        severity: v.severity,
        range: v.vulnerable_versions || v.range,
        direct: v.isDirect || false,
        nodes: v.nodes || []
    };
});

console.log(`Total vulns: ${summary.length}`);

// group by severity
const severities = { critical: 0, high: 0, moderate: 0, low: 0 };
summary.forEach(v => { if (severities[v.severity] !== undefined) severities[v.severity]++; });
console.log(severities);

// Print the most severe direct ones, or just unique names
const unique = [...new Set(summary.map(v => v.name))];
console.log("Vulnerable packages:", unique.join(', '));
