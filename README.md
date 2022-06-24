# GLIX Action – the Git Log Identifier eXtractor

This action extracts all Jira issue keys from a certain git commit and its relevant parents

The regex is based on [Atlassian Documentation](https://confluence.atlassian.com/stashkb/integrating-with-custom-jira-issue-key-313460921.html).

## Inputs
- `commitId`: the ID (sha) of the relevant commit
- `mainBranch`: the main branch of the repo (e.g. "master" or "main")
- `baseDir`: (optional) the path of the git repo to use

## Outputs
- `issueKeys`: the found Jira issue keys from all commit messages separated by a comma (e.g. `TEST-1,TEST-2`)

## Usage

Most of you probably use "actions/checkout@v2" (or v3) to checkout the repo in the action run.
By default that action uses a `fetch-depth` of 1, so only the last commit is fetched. 
This plugin "walks" the repository so we need more commits. Therefore
you have to define a higher `fetch-depth` so we have a certain git history.
A good value for example would be 30. Values higher than 50 don't make sense
as the plugin caps logs to 50 elements.

### Example usage
```yaml
- uses: actions/checkout@v3
  with:
    fetch-depth: '30'
- uses: levigo/github-action-glix@v1.0
  id: glix
  with:
    commitId: "my-company.atlassian.net"
    mainBranch: "master"
```

#### Usage with "Jira create and set fix version"

Here is an example on how to extract the `issueKey` from the commit messages and set the same fix version 
for all those Jira issues.

```yaml
  - uses: actions/checkout@v3
    with:
      fetch-depth: '30'

  - uses: levigo/github-action-glix@v1.0
    id: glix
    with:
      commitId: ${{ github.sha }}
      mainBranch: "master"

  - uses: levigo/github-action-jira-fixversion@v1.0
    with:
      domain: "my-company.atlassian.net"
      username: "technical-user@company.net"
      password: "fmpUJkGhdKFvoTJclsZ03xw1"
      versionName: "1.0.5"
      versionDescription: "Continuous Delivery Version"
      issueKeys: ${{ steps.glix.outputs.issueKeys }}
```
