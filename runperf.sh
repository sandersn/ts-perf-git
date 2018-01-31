function perfsave {
    echo -----------------------------------  $1 --------------------
    pushd /home/nathansa/TypeScript
    git checkout $1
    jake clean
    jake
    cd /home/nathansa/TypeScript/internal/scripts/perf/bin
    ./ts-perf benchmark --iterations 10 --save /home/nathansa/src/perf2.7/$1.benchmark # --scenario "Compiler - Unions"
    popd
}
function perfload {
    echo ------------------------------------ $1 --------------------
    /home/nathansa/TypeScript/internal/scripts/perf/bin/ts-perf benchmark --load $1.benchmark --baseline 7bb5fc2.benchmark
}
