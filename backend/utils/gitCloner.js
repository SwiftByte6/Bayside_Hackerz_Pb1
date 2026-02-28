const simpleGit = require('simple-git');
const path = require('path');

/**
 * Clone a GitHub repository to a target directory
 * @param {string} repoUrl - GitHub repo URL
 * @param {string} destDir - destination directory  
 * @returns {string} path to cloned repo
 */
async function cloneRepo(repoUrl, destDir) {
    const repoPath = path.join(destDir, 'repo');
    const git = simpleGit();

    // Clone with depth=1 for speed
    await git.clone(repoUrl, repoPath, ['--depth', '1', '--single-branch']);

    return repoPath;
}

module.exports = { cloneRepo };
