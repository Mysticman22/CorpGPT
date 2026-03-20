const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        let filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.jsx')) results.push(filePath);
        }
    });
    return results;
}

const files = walk('C:/CorpGPT/frontend/src');
let totalUpdates = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Scale down clamp( A px, B vw, C px )
    const newContent = content.replace(/clamp\(\s*([\d.]+)px\s*,\s*([\d.]+)vw\s*,\s*([\d.]+)px\s*\)/g, (match, min, vw, max) => {
        const newMin = Math.round(parseFloat(min) * 0.4);
        const newVw = (parseFloat(vw) * 0.4).toFixed(1).replace(/\.0$/, ''); // remove .0 if whole
        const newMax = Math.round(parseFloat(max) * 0.4);
        return `clamp(${newMin}px, ${newVw}vw, ${newMax}px)`;
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated clamp values in: ${file}`);
        totalUpdates++;
    }
});

console.log(`Finished processing. Updated ${totalUpdates} files.`);
