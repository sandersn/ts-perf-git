import sh = require('shelljs')
import fs = require('fs')
import argparse = require('argparse')
const parser = new argparse.ArgumentParser()
parser.addArgument(['-o', '--overwrite'], { action: 'storeTrue' })
const overwrite = parser.parseArgs()['overwrite'] || false
function runPerf(commit: string) {
    const filename = commit + '.benchmark'
    if (sh.test('-e', filename) && !overwrite) {
        return
    }
    sh.pushd('~/TypeScript')
    sh.exec('git checkout ' + commit)
    sh.exec('jake clean')
    sh.exec('jake tsc')
    sh.exec('node internal/scripts/perf/out/ts-perf-cli/cli.js benchmark --iterations 10 --save ~/src/perf2.7/' + filename)
    sh.popd()
}
function loadCommits(path: string) {
    const commits = fs.readFileSync(path, 'utf8').split('\n')
    let i = 0
    for (const commit of commits) {
        i++
        console.log(`----------------------------- ${commit} (${i}/${commits.length}) ----------------------------`)
        runPerf(commit)
    }
}
loadCommits('./merge-commits.txt')
