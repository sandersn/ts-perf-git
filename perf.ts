import sh = require('shelljs')
import fs = require('fs')
import argparse = require('argparse')

const parser = new argparse.ArgumentParser()
parser.addArgument(['-o', '--overwrite'], { action: 'storeTrue' })
parser.addArgument(['--scenario'], { action: 'store' })
parser.addArgument(['--pass'], { action: 'store' })
parser.addArgument(['--commit'], { action: 'store' })
const scenarioMap: { [s: string]: number } = {
    Angular: 0,
    Compiler: 1,
    'Compiler - Unions': 2,
    Monaco: 3,
    TFS: 4
}
const args = parser.parseArgs()
const overwrite = args['overwrite'] || false

// const progress = new ProgressBar(process.stderr, { clear: true });
// const logger = new Logger(LogLevel.Verbose, { out: process.stdout, err: process.stderr, progress });
// const host = new HostContext(logger);
function runPerf(commit: string) {
    const filename = commit + '.benchmark'
    if (sh.test('-e', filename) && !overwrite) {
        return
    }
    sh.pushd('~/TypeScript')
    sh.exec('git checkout ' + commit)
    sh.exec('jake clean')
    sh.exec('jake tsc')
    sh.popd()
    // await perf.benchmark({ iterations: 10, save: [commit + ".benchmark"], tsc: '~/TypeScript/built/local/tsc.js', suite: "~/TypeScript/internal/cases/perf/solutions" }, host)
    sh.exec('node ~/TypeScript/internal/scripts/perf/bin/ts-perf benchmark --iterations 10 --save ~/src/perf2.7/' + filename)
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
function diffCommits(path: string) {
    const commits = fs.readFileSync(path, 'utf8').split('\n')
    const baseline = JSON.parse(fs.readFileSync(commits[0] + '.benchmark', 'utf8')) as Benchmark
    const scenario = args['scenario'] ? scenarioMap[args['scenario']] : 0
    const pass = args['pass'] && args['pass'] === 'check' ? 'checkTime' : 'emitTime'
    for (const commit of commits) {
        diffPerf(baseline, scenario, pass, commit)
    }
    console.log(` --------- ${args['scenario']} (${scenario}): ${pass} ------------`)
}
interface Benchmark {
    measurements: Scenario[]
}
interface Scenario {
    scenarioName: string
    checkTime: Metric
    emitTime: Metric
}
interface Metric {
    relativeMarginOfError: number
    mean: number
}
function diffPerf(baseline: Benchmark, scenario: number, pass: 'checkTime' | 'emitTime', commit: string) {
    const benchmark = JSON.parse(fs.readFileSync(commit + '.benchmark', 'utf8')) as Benchmark
    const warning = (baseline.measurements[scenario][pass].relativeMarginOfError > 0.05 ? '*' : '') +
        (benchmark.measurements[scenario][pass].relativeMarginOfError > 0.05 ? '*' : '')
    const diff = benchmark.measurements[scenario][pass].mean - baseline.measurements[scenario][pass].mean
    console.log(warning + (diff / baseline.measurements[scenario][pass].mean * 100) + "%")
    // const b: Benchmark = await perf.Benchmark.loadAsync(baseline + '.benchmark', host)
    // sh.exec(`node ~/TypeScript/internal/scripts/perf/bin/ts-perf benchmark --load ${commit}.benchmark --baseline ${baseline}.benchmark`)
}
if (args['scenario'] || args['pass']) {
    diffCommits('./merge-commits.txt')
}
else if (args['commit']) {
    runPerf(args['commit'])
}
else {
    loadCommits('./merge-commits.txt')
}
