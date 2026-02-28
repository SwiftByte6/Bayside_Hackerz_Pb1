const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs-extra');

/**
 * Extract a zip file to a target directory
 * @param {string} zipPath - path to the zip file
 * @param {string} destDir - destination directory
 * @returns {string} path to the extracted content
 */
async function extractZip(zipPath, destDir) {
    const extractPath = path.join(destDir, 'repo');
    await fs.ensureDir(extractPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // If there's only one top-level folder, use it as root
    const entries = await fs.readdir(extractPath);
    if (entries.length === 1) {
        const singleEntry = path.join(extractPath, entries[0]);
        const stat = await fs.stat(singleEntry);
        if (stat.isDirectory()) {
            return singleEntry;
        }
    }

    return extractPath;
}

module.exports = { extractZip };
