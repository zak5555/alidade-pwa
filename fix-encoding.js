const fs = require('fs');
const path = require('path');

function removeBOM(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath);

    // Check for BOM (0xEF, 0xBB, 0xBF)
    if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
        console.log(`Removing BOM from ${filename}`);
        fs.writeFileSync(filePath, content.slice(3));
        console.log(`Successfully cleaned ${filename}`);
    } else {
        console.log(`${filename} is clean (no BOM detected)`);
    }
}

removeBOM('i18n/fr.js');
removeBOM('i18n/es.js');
