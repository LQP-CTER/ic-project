const fs = require('fs');
let file = fs.readFileSync('src/data/workflowTemplates.ts', 'utf8');
file = file.replace(/priority: 0;/g, "priority: 'High' | 'Medium' | 'Low';");
file = file.replace(/priority: High/g, "priority: 'High'");
file = file.replace(/priority: Medium/g, "priority: 'Medium'");
file = file.replace(/priority: Low/g, "priority: 'Low'");
fs.writeFileSync('src/data/workflowTemplates.ts', file);
console.log('Fixed workflowTemplates.ts');
