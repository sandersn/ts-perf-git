import sh = require('shelljs')
import fs = require('fs')
const overwrite = false // TODO parse this from the command line
function runPerf(commit: string) {
    const filename = commit + '.benchmark'
    if (sh.test('-e', filename) && !overwrite) {
        return
    }
    sh.test('', commit + '.benchmark')
    sh.pushd('~/TypeScript')
    sh.exec('git checkout ' + commit)
    sh.exec('jake clean')
    sh.exec('jake')
    sh.cd('~/TypeScript/internal/scripts/perf/bin')
    sh.exec('./ts-perf benchmark --iterations 10 --save ~/src/perf2.7/' + filename)
    sh.popd()
}
function loadCommits(path: string) {
    for (const commit of fs.readFileSync(path, 'utf8').split('\n')) {
        runPerf(commit)
    }
}
loadCommits('./merge-commits.txt')
