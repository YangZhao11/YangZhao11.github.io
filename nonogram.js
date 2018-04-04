function CheckDims(width, height) {
    if (width <= 0 || width > 100) {
        window.alert("Bad Width")
        return false
    }
    if (height <= 0 || height > 100) {
        window.alert("Bad Height")
        return false
    }
    return true
}

const STATE_EMPTY = 0
const STATE_SOLID = 1
const STATE_X = 2

class UI {
    constructor(tb) {
        this.tb = tb
        this.color = 1
    }

    log(str) {
        console.log(str)
        // TODO: better messaging
    }

    // setXY set cell (x,y) to state and marked with current color.
    setXY(x,y,state) {
        let cell = document.getElementById("g"+x+"-"+y)
        if (!cell) {
            return
        }
        switch (state) {
        case STATE_EMPTY:
            cell.className = "g"
            break
        case STATE_SOLID:
            cell.className = "g set c" + this.color
            break
        case STATE_X:
            cell.className = "g x c" + this.color
        }
    }

    createDOM(width, height) {
        let tb = this.tb
        this.width = width
        this.height = height

        while (tb.firstChild) {
            tb.removeChild(tb.firstChild)
        }

        // header row with inputs
        let tr = document.createElement("tr")
        // empty top-left corner
        tr.appendChild(document.createElement("th"))
        for (let w = 0; w < width; w++) {
            let th = document.createElement("th")
            th.className = 'colH'
            let div = document.createElement("div")
            let colInput = document.createElement("input")
            colInput.type = "text"
            colInput.id = "c"+w
            div.appendChild(colInput)
            th.appendChild(div)
            tr.appendChild(th)
        }
        tb.appendChild(tr)

        for (let h = 0; h < height; h++) {
            let tr = document.createElement("tr")
            let th = document.createElement("th")
            th.className = 'rowH'
            let rowInput = document.createElement("input")
            rowInput.type = "text"
            rowInput.id = 'r'+h
            th.appendChild(rowInput)
            tr.appendChild(th)
            for (let w = 0; w < width; w++) {
                let td = document.createElement("td")
                td.className = "g"
                td.id = "g"+w+"-"+h
                tr.appendChild(td)
            }
            tb.appendChild(tr)
        }
    }

    replaceInput(input) {
        let id = input.id
        let vals = input.value.split(" ").map(x => parseInt(x)).filter(x => !isNaN(x))
        let parent = input.parentNode
        parent.removeChild(input)
        vals.forEach((v, i) => {
            let span = document.createElement("span")
            span.textContent = v
            span.className = "segment"
            span.id = id + "-" + i
            parent.appendChild(span)
        })
        return vals
    }

    getSegments() {
        let cols = []
        for (let x = 0; x < this.width; x++) {
            cols.push(this.replaceInput(document.getElementById("c"+x)))
        }
        let rows = []
        for (let y = 0; y < this.height; y++) {
            rows.push(this.replaceInput(document.getElementById("r"+y)))
        }
        return {rows, cols}
    }

}

var ui

function OnClearBtn() {
    let width = parseInt(document.getElementById("dim-width").value)
    let height = parseInt(document.getElementById("dim-height").value)
    if (!CheckDims(width, height)) {
        return
    }
    ui = new UI(document.getElementById("tb"))
    ui.createDOM(width, height)
    solver = null
    if (runner) {
        runner.pause()
    }
    runner = null

    let btnSolve = document.getElementById("btn-solve")
    btnSolve.value = "▶"
}


function OnTestBtn() {
    document.getElementById("dim-width").value = "10"
    document.getElementById("dim-height").value = "10"
    OnClearBtn()
    setTimeout(function(){
        document.getElementById("r0").value = "1 1"
        document.getElementById("r1").value = "1 1"
        document.getElementById("r2").value = "1 1 1"
        document.getElementById("r3").value = "1 2 1"
        document.getElementById("r4").value = "5"
        document.getElementById("r5").value = "5 1"
        document.getElementById("r6").value = "7"
        document.getElementById("r7").value = "7"
        document.getElementById("r8").value = "6"
        document.getElementById("r9").value = "5 3"

        document.getElementById("c0").value = "6 1"
        document.getElementById("c1").value = "3 2"
        document.getElementById("c2").value = "6"
        document.getElementById("c3").value = "7"
        document.getElementById("c4").value = "9"
        document.getElementById("c5").value = "3"
        document.getElementById("c6").value = "1 3"
        document.getElementById("c7").value = "2 1"
        document.getElementById("c8").value = "1 1 1"
        document.getElementById("c9").value = "2 1"
    })
}

// Slice is a reference to a column or row in the grid.
class Slice {
    constructor(solver, offset0, step, length) {
        this.solver = solver
        this.g = solver.g
        this.offset0 = offset0
        this.step = step
        this.length = length
    }

    getX(i) {
        return this.g[this.offset0+this.step*i]
    }

    setX(i, val) {
        const o = this.offset0+this.step*i
        const x = o % this.solver.width
        const y = (o-x) / this.solver.width
        this.solver.setXY(x,y,val)
    }

    // returns the first position >= start where a hole of size length
    // is found. If no such hole is found, return -1.
    findHole(start, length) {
        let found = 0
        for (let i = start; i < this.length; i++) {
            if (this.getX(i) == STATE_X) {
                found = 0
            } else {
                found += 1
                if (found >= length) {
                    return i - found + 1
                }
            }
        }
        return -1
    }

    stripLength(i) {
        let val = this.getX(i)
        let n=0
        for (;i< this.length; i++) {
            if (this.getX(i) == val) {
                n++
            } else {
                return n
            }
        }
        return n
    }

    indexOfNextSolid(start) {
        for (let i = start; i < this.length; i++) {
            if (this.getX(i) == STATE_SOLID) {
                return i
            }
        }
        return -1
    }

    setSegment(i,j,val) {
        for (let n = i; n < j; n++) {
            this.setX(n, val)
        }
    }

    reverse() {
        return new Slice(solver, this.offset0 + this.step * (this.length-1), -this.step, this.length)
    }
}

// returns the last index in arr that's >= bound
function findLastIndex(arr, bound) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] >= bound) {
            return i
        }
    }
    return -1;
}

const ROW = 0
const COLUMN = 1

class Solver {
    constructor(ui) {
        this.ui = ui
        this.width = ui.width
        this.height = ui.height
        let seg = ui.getSegments()
        this.rows = seg.rows.map(
            r => ({
                len: r,
                lb: r.map(x=>0),
                ub: r.map(x=>this.width)
            }))
        this.cols = seg.cols.map(
            c => ({
                len: c,
                lb: c.map(x=>0),
                ub: c.map(x=>this.height)
            }))
        this.g = new Int8Array(this.width * this.height)
        this.dirty = []
        for (let x = 0; x < this.width; x++) {
            this.dirty.push({dir: COLUMN, num: x})
        }
        for (let y = 0; y < this.height; y++) {
            this.dirty.push({dir: ROW, num: y})
        }
    }

    getXY(x,y) {
        return this.g[x + y*this.width]
    }

    setXY(x,y, val) {
        if (val == this.getXY(x,y)) {
            return
        }
        this.g[x+y*this.width] = val
        this.ui.setXY(x,y,val)
        if (this.line.dir == ROW) {
            this.markDirty({dir: COLUMN, num: x})
        } else {
            this.markDirty({dir:ROW, num: y})
        }
    }

    markDirty(desc) {
        for (let i = 0; i < this.dirty.length; i++) {
            let d = this.dirty[i]
            if (d.dir == desc.dir && d.num == desc.num) {
                return
            }
        }
        this.dirty.push(desc)
    }

    /**
     * getSlice takes a description and returns a Slice object
     * referencing those cells. Description is an object with
     * dir=ROW|COLUMN and num.
     *
     */
    getSlice(desc) {
        if (desc.dir == ROW) {
            return new Slice(this, this.width*desc.num, 1, this.width)
        }
        return new Slice(this, desc.num, this.width, this.height)
    }

    getSegments(desc) {
        if (desc.dir == ROW) {
            return this.rows[desc.num]
        }
        return this.cols[desc.num]
    }

    // findLeftmostFit returns the leftmost possible position for each
    // segment as a integer array. Known leftmost position will be
    // obeied. This fit does not guarentee that all the SOLID cells
    // are potentially covered. Return false if a fit can not be
    // found.
    findLeftmostFit(slice, sLen, lb) {
        let cursor = 0
        for (let i = 0; i < sLen.length; i++) {
            if (lb[i] > cursor) {
                cursor = lb[i]
            }
            // see if we can find a hole at cursor that's big enough.
            let hole = slice.findHole(cursor, sLen[i])
            if (hole == -1) {
                this.ui.log("Can not find hole for segment "+ i)
                return
            }
            while (hole + sLen[i] < slice.length &&
                   slice.getX(hole + sLen[i]) == STATE_SOLID) {
                hole += 1
            }
            lb[i] = hole
            cursor = hole + sLen[i] + 1 // 1 for the space between this and next
        }
    }

    fitLeftMost(slice, sLen, lb) {
        this.findLeftmostFit(slice, sLen, lb)
        let last = sLen.length - 1
        let cursor = lb[last] + sLen[last] + 1
        // if there is any SOLID cells that's not covered by this
        // positioning, we need to move some of the segments to the
        // right to cover them.

        let nextSolid = slice.indexOfNextSolid(cursor)
        while (nextSolid != -1) {
            let stripLen = slice.stripLength(nextSolid)
            let fittingSegment = findLastIndex(sLen, stripLen)
            if (fittingSegment == -1) {
                this.ui.log("No segment long enough to cover "+ stripLen)
                return
            }
            lb[fittingSegment] = nextSolid + stripLen - sLen[fittingSegment]
            this.findLeftmostFit(slice, sLen, lb)
            last = sLen.length - 1
            cursor = lb[last] + sLen[last] + 1
            nextSolid = slice.indexOfNextSolid(cursor)
        }
    }

    *solveLine(slice, rowcol){
        this.fitLeftMost(slice, rowcol.len, rowcol.lb)
        this.fitLeftMost(slice.reverse(),
                         rowcol.len.slice().reverse(), rowcol.ub)
        // realUB is the real bound on the rightmost position
        let realUB = rowcol.ub.slice().reverse().map(x=>slice.length - x -1)

        for (let i = 0; i < rowcol.len.length; i++) {
            let l = rowcol.lb[i]
            let u = realUB[i]
            let len = rowcol.len[i]
            let prevU = -1
            if (i > 0) {
                prevU = realUB[i-1]
            }

            if (l > prevU+1) {
                slice.setSegment(prevU+1, l, STATE_X)
                yield
            }

            if (u-len+1 <= l+len-1) {
                slice.setSegment(u-len+1, l+len, STATE_SOLID)
                yield
            }
        }
        if (realUB[realUB.length-1]+1 < slice.length) {
            slice.setSegment(realUB[realUB.length-1]+1, slice.length, STATE_X)
            yield
        }
    }

    *solve() {
        while (this.dirty.length > 0) {
            this.line = this.dirty.pop()
            this.ui.log("looking at dir"+ this.line.dir+" num"+this.line.num)
            let slice = this.getSlice(this.line)
            let segments = this.getSegments(this.line)
            yield* this.solveLine(slice, segments)
        }
    }
}

var solver                      // solver object

class Runner {
    constructor(process, delay) {
        this.process = process
        this.delay = delay
        this.processID = null
    }

    runIt() {
        let n = this.process.next()
        if (!n.done) {
            let d = this.delay
            if (n.value != null) {
                d *= n.value
            }
            this.processID = setTimeout(this.runIt.bind(this), d)
        } else {
            this.processID = null
            this.process = null
        }
    }

    start() {
        if (!this.running()) {
            this.processID = setTimeout(this.runIt.bind(this))
        }
    }

    pause() {
        if (this.running()) {
            clearTimeout(this.processID)
            this.processID = null
        }
    }

    next() {
        if (this.process.next().done) {
            this.processID = null
            this.process = null
        }
    }

    finish() {
        while (!process.next().done) {
        }

        processID = null
        process = null
    }

    running() {
        return this.processID != null
    }
}

var runner

function OnSolveBtn() {
    if (runner != null && runner.running()) {
        runner.pause()
        this.value = "▶"
        return
    }

    if (runner == null) {
        solver = new Solver(ui)
        runner = new Runner(solver.solve(), delay)
    }

    runner.start()
    this.value = "❙❙"
}

function OnNextBtn() {
    if (runner == null) {
        console.log("Start solver first")
        return
    }
    runner.next()
}

function OnRunAllBtn() {
    if (runner == null) {
        console.log("Start solver first")
        return
    }
    runner.finish()
}

var delay
const delayValues = [2000, 1000, 500, 100, 10]

function OnDelayChange() {
    const v = parseInt(document.getElementById("delay").value)
    delay = delayValues[v]
    if (runner != null) {
        runner.delay = delay
    }
}


function OnLoaded() {
    document.getElementById("btn-clear").addEventListener("click", OnClearBtn)
    document.getElementById("btn-test").addEventListener("click", OnTestBtn)
    document.getElementById("btn-solve").addEventListener("click", OnSolveBtn)
    document.getElementById("btn-next").addEventListener("click", OnNextBtn)
    document.getElementById("btn-runall").addEventListener("click", OnRunAllBtn)
    document.getElementById("delay").addEventListener("change", OnDelayChange)
    OnDelayChange()
}

document.addEventListener("DOMContentLoaded", OnLoaded)
