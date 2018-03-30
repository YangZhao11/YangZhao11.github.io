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

    pushState() {
        this.color += 1
    }

    popState() {
        let cells = this.tb.getElementsByClassName("c"+this.color)
        for (c in cells) {
            c.className = "g"
        }
    }

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
    if (processID) {clearTimeout(processID)}
    ui.createDOM(width, height)

    process = null
    processID = null
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

    setSegment(i,j,val) {
        for (let n = i; n < j; n++) {
            this.setX(n, val)
        }
    }
}

const ROW = 0
const COLUMN = 1

class Solver {
    constructor(ui) {
        this.ui = ui
        this.width = ui.width
        this.height = ui.height
        let seg = ui.getSegments()
        this.rows = seg.rows
        this.cols = seg.cols
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

    *solveLine(slice, segments){
        for (let i = 0; i < slice.length; i++) {
            if (slice.getX(i) == STATE_EMPTY && Math.random()<0.2) {
                slice.setX(i, Math.floor(Math.random()*2)+1)
                yield
            }
        }
    }

    *solve() {
        while (this.dirty.length > 0) {
            this.line = this.dirty.pop()
            console.log("looking at dir"+ this.line.dir+" num"+this.line.num)
            let slice = this.getSlice(this.line)
            let segments = this.getSegments(this.line)
            yield* this.solveLine(slice, segments)
        }
    }
}

var process                     // generator
var delay                       // delay
var solver                      // solver object
var processID                   // id returned by setTimeOut

function runProcess() {
    let n = process.next()
    if (!n.done) {
        let d = delay
        if (n.value != null) {
            d *= n.value
        }
        processID = setTimeout(runProcess, d)
    } else {
        processID = null
        process = null

    }
}

function OnSolveBtn() {
    if (processID != null) {
        clearTimeout(processID)
        processID = null
        this.value = "▶"
    } else if (process != null) {
        processID = setTimeout(runProcess)
        this.value = "❙❙"
    } else {
        solver = new Solver(ui)
        process = solver.solve()
        processID = setTimeout(runProcess)
        this.value = "❙❙"
    }
}

function OnNextBtn() {
    if (process == null) {
        console.log("Start solver first")
        return
    }
    if (process.next().done) {
        processID = null
        process = null
    }
}

function OnRunAllBtn() {
    if (process == null) {
        console.log("Start solver first")
        return
    }
    while (!process.next().done) {
    }

    processID = null
    process = null
}

const delayValues = [2000, 1000, 500, 100, 10]

function OnDelayChange() {
    let v = parseInt(document.getElementById("delay").value)
    delay = delayValues[v]
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
