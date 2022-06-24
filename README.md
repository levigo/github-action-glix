# GLIX Action – the Git Log Identifier eXtractor

This action extracts all Jira issue keys from a certain git commit and its relevant parents

The regex is based on [Atlassian Documentation](https://confluence.atlassian.com/stashkb/integrating-with-custom-jira-issue-key-313460921.html).

## Inputs
- `commitId`: the ID (sha) of the relevant commit
- `mainBranch`: the main branch of the repo (e.g. "master" or "main")
- `baseDir`: (optional) the path of the git repo to use

## Outputs
- `issueKeys`: the found Jira issue keys from all commit messages separated by a comma (e.g. `TEST-1,TEST-2`)

## Example usage
```yaml
uses: levigo/github-action-glix@v1.0
id: glix
with:
  commitId: "my-company.atlassian.net"
  mainBranch: "master"
```

### Usage with "Jira create and set fix version"

Here is an example on how to extract the `issueKey` from the commit messages and set the same fix version 
for all those Jira issues.

```yaml
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
