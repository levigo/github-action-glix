const core = require("@actions/core");
const findRelevantCommits = require("./genealogist");

let baseDir, commitId, mainBranch;
(async () => {
    try {
        commitId = core.getInput("commitId");
        mainBranch = core.getInput("mainBranch");
        baseDir = core.getInput("password");

        const commitMessages = await findRelevantCommits(commitId, mainBranch, baseDir);
        const jiraIssueKeys = getJiraIssueKeys(commitMessages).join(",");
        core.setOutput("issueKeys", jiraIssueKeys);
    } catch (error) {
        core.setFailed(error.message);
    }
})();

/**
 * Default Regular Expression which will match standard Jira Issue Identifiers. These consist of
 * the following three parts:
 * <ol>
 * <li>A Jira Project identifier, consisting of capital letters only</li>
 * <li>A hyphen character</li>
 * <li>A Jira Issue Number within the Project, which is a positive integer number</li>
 * </ol>
 * Example: <code>GLIX-4711</code>
 * <p>
 * Atlassian mentions the following standard pattern in their documentation:
 *
 * <pre>
 *     ((?&lt;!([A-Z]{1,10})-?)[A-Z]+-\d+)
 * </pre>
 *
 * (Source: <a href=
 * "https://confluence.atlassian.com/stashkb/integrating-with-custom-jira-issue-key-313460921.html">Atlassian</a>)
 * <p>
 * The Pattern uses a look-behind in order to avoid matching other identifiers which look similar,
 * but aren't used for Jira. Examples would be Crucible Review Keys (such as
 * <code>CR-PROJ-1234</code>) or Bamboo build plan IDs which look similar. (Source: <a href=
 * "https://community.atlassian.com/t5/Bitbucket-questions/Regex-pattern-to-match-JIRA-issue-key/qaq-p/233319">Atlassian</a>)
 * <p>
 * We use a slightly modified version which has the following additions:
 * <ol>
 * <li>It employs a lookahead at the end to ensure that the Issue ID is properly terminated. If
 * there are any characters after the Issue ID, they must be whitespace or certain punctuation
 * characters.</li>
 * <li>It requires the first digit to be non-zero. This has two effects:
 * <ol>
 * <li>It will not match the invalid issue key that has 0 as its only digit (e.g.
 * <code>GLIX-0</code>)</li>
 * <li>It will not accept leading zeroes (e.g. <code>GLIX-007</code> as opposed to
 * <code>GLIX-7</code>)</li>
 * </ol>
 * </li>
 * </ol>
 */
const defaultRegex = new RegExp("((?<!([A-Z]{1,10})-?)[A-Z]+-[1-9]\\d*(?![^\\s:.,;!\"/|)}\\]?+&]))");

/**
 * Uses the Regex to extract a Jira issue key from the given commit messages. If multiple Jira issue keys
 * are part of the commitMessages, only the first occurrence will be considered.
 *
 * @param commitMessages
 * @returns {*[]}
 */
function getJiraIssueKeys(commitMessages) {
    const retVal = [];
    for (let i = 0; i < commitMessages.length; i++) {
        let commitMessage = commitMessages[i];
        if (defaultRegex.test(commitMessage)) {
            const message = defaultRegex.exec(commitMessage)[0];
            if (retVal.indexOf(message)<0) {
                retVal[retVal.length] = message;
            }
        }
    }
    return retVal;
}


