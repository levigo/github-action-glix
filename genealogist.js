const simpleGit = require("simple-git");
const core = require("@actions/core");
// const debug = require('debug');
// debug.enable('simple-git,simple-git:*');

let git;

/**
 * This will find all relevant commits for a given commitId and return the commit messages of them.
 * Relevant means one of the following 3:
 * <ul>
 *     <li>a merge-commit: all commits of the feature-branch are searched</li>
 *     <li>a direct commit to the mainBranch: only the commit itself is searched</li>
 *     <li>a commit on a not (yet) merged feature-branch: all commits of the feature-branch are searched</li>
 * </ul>
 *
 * @param commitId
 * @param mainBranch the main branch of the repo, e.g. "master" or "main"
 * @param baseDir the directory for the git repo (optional)
 * @returns {Promise<*[]>}
 */
async function findRelevantCommits(commitId, mainBranch, baseDir) {
    if (!!baseDir) {
        core.debug("Using the following baseDir: " + baseDir);
        const options = {
            baseDir: baseDir
        };
        git = simpleGit(options);
    } else {
        core.debug("Using the default baseDir");
        git = simpleGit();
    }

    if (!mainBranch) {
        mainBranch = "master";
    }
    core.debug("Using the following mainBranch: " + mainBranch);
    core.debug("Starting search of relevant parents for the following commit: " + commitId);
    const isMerge = await isMergeCommit(commitId);
    core.debug("Is this a merge commit? " + isMerge);
    let commitMessages;
    if (isMerge) {
        // case: This is a merge commit. If the mainBranch is involved, find all commits that are
        // not on the mainBranch. Else: Use the first parent instead of mainBranch.
        const parentCommits = await getParents(commitId);
        core.debug("Found parents: " + !!parentCommits ? parentCommits.length : 0);
        commitMessages = getCommitMessages(parentCommits);
    } else { // else: This is not a merge commit
        const isOnMainBranch = await isOnBranch(commitId, mainBranch);
        core.debug("Is this on the main branch? " + isOnMainBranch);
        if (isOnMainBranch) {
            // case: single commit on main branch --> this is the only relevant commit
            const commitMessage = await getCommitMessage(commitId);
            commitMessages = [commitMessage];
        } else {
            // case: commit on branch != mainBranch -> all commits which are not on mainBranch are relevant
            const parentCommits = await getParents(commitId, mainBranch);
            commitMessages = getCommitMessages(parentCommits);
        }
    }
    return commitMessages;
}

/**
 * Checks if a commit is a merge-commit.
 * This is done by running git show on the commit. As per definition
 * of git show, the 2nd line will start with "Merge:"
 *
 * @param commitId
 * @returns {Promise<boolean>}
 */
async function isMergeCommit(commitId) {
    try {
        let info = await git.revparse(commitId+"^2");
        return !!info;
    } catch (e) {
        return false;
    }
}

/**
 * Gets the ID of the commit where the branch started (for merge-commits).
 *
 * @param commitId
 * @returns {Promise<string|undefined>}
 */
async function getBaseId(commitId) {
    let info = await git.show(commitId);
    info = info.split("\n");
    if (info[1].toLowerCase().indexOf("merge:") === 0) {
        const arr = info[1].toLowerCase().split(" ");
        return arr[1];
    }
    return undefined;
}

/**
 * Gets the IDs of all parents for the given commitId back to the baseId.
 * If baseId is empty, we try to find the baseId which is only possible for merge-commits.
 * The commitId itself is not part of the result and the result will be cut at 50 commits.
 *
 * @param commitId
 * @param baseId
 * @returns {Promise<undefined|*>}
 */
async function getParents(commitId, baseId) {
    if (!baseId) {
        baseId = await getBaseId(commitId);
    }
    if (!!baseId) {
        core.debug("Searching parents from " + baseId + " to " + commitId);
        const log = await git.log({from: baseId, to: commitId})
        return log.all.slice(1, 51); // omit the first as it is the commitId itself
    } else {
        return undefined;
    }
}

/**
 * Gets the commit message for a certain commitId
 *
 * @param commitId
 * @returns {Promise<*>}
 */
async function getCommitMessage(commitId) {
    let info = await git.show([commitId, "--pretty=oneline"]);
    return info.split("\n")[0].replace(commitId + " ", "");
}

/**
 * Gets the commit messages of the given commits
 *
 * @param commits
 * @returns {*[]}
 */
function getCommitMessages(commits) {
    const retVal = [];
    for (let i = 0; i < commits.length; i++) {
        let commit = commits[i];
        if (typeof commit !== "string") {
            commit = commit.message;
        }
        retVal[retVal.length] = commit;
    }
    return retVal;
}

/**
 * Checks if a commitId is on the given baseBranch. Only the last 50 commits
 * of the baseBranch are considered.
 *
 * @param commitId
 * @param baseBranch
 * @returns {Promise<boolean>}
 */
async function isOnBranch(commitId, baseBranch) {
    let log = await git.log([baseBranch, "--max-count=50"]);
    log = log.all;
    for (let i = 0; i < log.length; i++) {
        const logElement = log[i];
        if (logElement.hash === commitId) {
            return true;
        }
    }
    return false;
}

module.exports = findRelevantCommits;
