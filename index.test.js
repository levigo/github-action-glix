const main = require('./index');

test('extracts simple keys', () => {
    expect(main.getJiraIssueKeys([
        "Bla fasel FOO-17 test 1 2 3",
    ])).toStrictEqual([
        "FOO-17"
    ]);
});
test('extracts at start end end', () => {
    expect(main.getJiraIssueKeys([
        "FOO-1 Bla fasel test 1 2 3 FOO-2",
    ])).toStrictEqual([
        "FOO-1",
        "FOO-2"
    ]);
});
test('extracts multiple keys', () => {
    expect(main.getJiraIssueKeys([
        "Bla fasel FOO-17 test FOO-19 1 2 3",
    ])).toStrictEqual([
        "FOO-17",
        "FOO-19"
    ]);
});

test('extracts from conventionalcommit', () => {
    expect(main.getJiraIssueKeys([
        "fix(FOO-17): do something",
    ])).toStrictEqual([
        "FOO-17"
    ]);
});

test('doesn\'t match junk', () => {
    expect(main.getJiraIssueKeys([
        "FOO_17 BAR-0123 BAZ-99a",
    ])).toStrictEqual([
    ]);
});
