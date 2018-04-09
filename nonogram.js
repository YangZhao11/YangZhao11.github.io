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
        this.brush = STATE_SOLID
        this.mouseDownHandler = this.onMouseDown.bind(this)
        this.mouseUpHandler = this.onMouseUp.bind(this)
        this.mouseMoveHandler = this.onMouseMove.bind(this)
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

    highlightLine(line) {
        let th = document.getElementById("th-"+line)
        if (th) {
            th.classList.add("hl")
        }
    }

    unhilightLine(line) {
        let th = document.getElementById("th-"+line)
        if (th) {
            th.classList.remove("hl")
        }
    }

    highlightSegment(line, segmentIndex) {
        let span = document.getElementById(line+"-"+segmentIndex)
        if (span) {
            span.classList.add("hl")
        }
    }

    unhighlightSegment(line, segmentIndex) {
        let span = document.getElementById(line+"-"+segmentIndex)
        if (span) {
            span.classList.remove("hl")
        }
    }

    dimSegment(line, segmentIndex) {
        let span = document.getElementById(line+"-"+segmentIndex)
        if (span) {
            span.classList.add("dim")
        }
    }

    undimSegment(line, segmentIndex) {
        let span = document.getElementById(line+"-"+segmentIndex)
        if (span) {
            span.classList.remove("dim")
        }
    }

    highlightCell(x,y) {
        let g = document.getElementById("g"+x+"-"+y)
        if (g) {
            g.classList.add("hl")
        }
    }

    unhighlightCell(x,y) {
        let g = document.getElementById("g"+x+"-"+y)
        if (g) {
            g.classList.remove("hl")
        }
    }

    clearColor() {
        let c = document.getElementsByClassName("c" + this.color)
        while (c.length > 0) {
            c[0].className = "g"
        }
    }

    onMouseDown(event) {
        let id = event.target.id
        if (id.charAt(0) != "g") {
            return
        }
        event.stopPropagation()
        this.brush = event.target.classList.contains("set")? STATE_EMPTY:STATE_SOLID
        this.brushCell(event.target)
        this.tb.addEventListener("mousemove", this.mouseMoveHandler)
    }

    onMouseMove(event) {
        if (event.buttons & 1 == 0) {
            this.onMouseUp(event)
            return
        }
        event.stopPropagation()
        this.brushCell(event.target)
    }

    onMouseUp(event) {
        this.tb.removeEventListener("mousemove", this.mouseMoveHandler)
    }

    brushCell(grid) {
        if (grid.id.charAt(0) != "g") {
            return
        }
        let coord = grid.id.substr(1).split("-").map(x=>parseInt(x))
        if (this.brush == STATE_EMPTY) {
            grid.classList.remove("set")
            grid.classList.remove("c1")
        } else {
            grid.classList.add("set")
            grid.classList.add("c1")
        }
        this.updateColInput(coord[0])
        this.updateRowInput(coord[1])
    }

    updateColInput(c) {
        let state = new Int8Array(this.height)
        for (let r = 0; r < this.height; r++) {
            let g = document.getElementById("g"+ c + "-" + r)
            state[r] = g.classList.contains("set")? STATE_SOLID : STATE_EMPTY
        }
        document.getElementById("c"+c).value = this.segmentsFromState(state)
    }

    updateRowInput(r) {
        let state = new Int8Array(this.width)
        for (let c = 0; c < this.width; c++) {
            let g = document.getElementById("g"+ c + "-" + r)
            state[c] = g.classList.contains("set")? STATE_SOLID : STATE_EMPTY
        }
        document.getElementById("r"+r).value = this.segmentsFromState(state)
    }

    segmentsFromState(state) {
        let counted = 0
        let segments = new Array()
        for (let i = 0; i < state.length; i++) {
            if (state[i] == STATE_SOLID) {
                counted++
            } else if (counted > 0) {
                segments.push(counted)
                counted = 0
            }
        }
        if (counted > 0) {
            segments.push(counted)
            counted = 0
        }
        return segments.join(" ")
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
            th.id = "th-c"+w
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
            th.id = 'th-r' + h
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

        setTimeout(()=>{
            tb.addEventListener("mousedown", this.mouseDownHandler)
            tb.addEventListener("mouseup", this.mouseUpHandler)
        })
    }

    clearDrawing() {
        this.tb.removeEventListener("mousedown", this.mouseDownHandler)
        this.tb.removeEventListener("mouseup", this.mouseUpHandler)
        this.tb.removeEventListener("mousemove", this.mouseMoveHandler)

        for (let e of document.getElementsByClassName("g")) {
            e.classList.remove("set")
            e.classList.remove("c1")
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
    btnSolve.className = "play"
    btnSolve.title = "play"
}


const presets = {
    "TV": {
        "width": "10",
        "height": "10",
        "rows": ["1 1", "1 1", "10", "1 2 2", "3 1",
                 "1 1 1", "3 1", "4 2", "10", "1 1"],
        "cols": ["7", "1 1 4", "1 7", "3 2", "1 1",
                 "1 1", "2 1", "1 1 1", "2 3", "7"]
    },
    "Butterfly": {
        "width": "15",
        "height": "15",
        "rows": ["3 1", "5 6", "2 4 1", "2 1 3 1 2", "1 1 3 2 2",
                 "1 1 2 1 1 2", "1 2 3 2", "2 2 2 4", "1 1 1 1 4", "1 2 4",
                 "6 1", "3 1 2", "3 1", "2 2 2", "2 3"],
        "cols": ["1", "5 1", "3 2 1", "3 2 3", "2 1 8",
                 "2 4 5", "1 3 1 1 1 1", "3 1 1 1", "2 3 1 1 2", "2 1 1 1 1",
                 "2 3 4 1", "1 1 3 3", "1 4 1", "1 6", "5 1"]
    },
    "Santa": {
        "width": "25",
        "height": "25",
        "rows": ["10", "14", "16", "17", "18",
                 "2 6", "1 5", "1 1 2", "13 1 1", "2 3 4 1 1",
                 "14 2 2", "2 2 5 3 1", "1 10 2", "2 4 1", "1 5 7 1",
                 "2 1 2 1 2", "3 2 4 4 3", "2 4 4 4", "2 4", "2 4",
                 "2 4", "3 5", "3 5", "4 7", "6 10"],
        "cols": ["9", "10", "4 4", "3 2", "2 1 1",
                 "3 2 3 1", "3 4 1 2", "3 1 3 1 1", "4 1 1 1 1 1", "4 1 4 2",
                 "4 6 2", "5 6 2", "5 6 2", "5 1 3 1 1", "5 1 1 1 1 1",
                 "5 1 3 1 2 1", "5 5 1 1 1", "5 4 1 1 1", "6 2 3 2", "8 2 1 2",
                 "7 3 4", "6 2 13", "6 1 10", "4 1 9", "2 8"]
    },
    "Bear": {
        "width": "25",
        "height": "30",
        "rows": ["6", "8", "3 4", "2 2 2", "1 1 5 4 3",
                 "1 1 3 1 1 2 1 1", "5 3 1 2 1 3", "7 1 2 5", "1 1 5 3 8", "3 3 2 3 1 1",
                 "4 1 1 1", "4 4 2", "1 1 4 2", "1 1 1 1", "1 5 1 1",
                 "4 2 1 1", "2 2 1 1 1", "4 1 1 1 1", "2 1 1 1 1", "1 2 1 2 2 1 1",
                 "1 1 3 1 2 1", "2 1 3 3 1", "4 1 2 2 1", "1 7 3 1", "2 3 2",
                 "11 2", "2 2 4", "2 1 3 7", "2 8 3", "3 2 1 2"],
        "cols": ["1 4 2", "4 2 2 2 4", "1 2 1 1 2 5 1", "6 1 1 1 2 1 1", "2 2 1 1 1",
                 "2 3 1 5", "3 2 1 1 1 5", "6 1 1 3 1 2", "9 5 1 1 1 1 1", "3 2 2 1 1 2 1 1 1",
                 "3 1 3 1 1 2 2 1 1", "2 3 1 1 1 1 2 3 1 1", "2 1 1 1 2 3 2 1 1", "3 2 2 1 1 5 1 2 1", "3 1 1 2 3 1",
                 "4 4 4 2", "7 1 7 3", "5 4 1 5", "2 1 6", "3 12",
                 "4", "1 5", "1 3 1", "4 2", "1"]
    },
    "Very Hard": {
        "width": "50",
        "height": "40",
        "rows": ["23", "19 6", "8 3", "3 2", "3 7 9 2",
                 "3 2 4 2 2", "2 2", "1 1", "1 6 2", "2 4 10 2",
                 "2 7 2 8 1 3", "2 2 10 2 10 1 3", "5 4 4 2 6 2", "2 4 1 2 4 3 2", "2 8 2 6 1 2 2",
                 "2 1 4 2 3 2 1", "2 1 2 4 7 2 1", "2 3 4 1 2 4 6 2", "4 3 5 4 1 5 2 1 2", "1 4 4 2 8 3 3",
                 "2 6 2 5 7 3", "2 23 7 3", "1 5 12 2 6 2 2", "1 4 2 2 1 9 2 2", "1 26 4 1",
                 "1 24 2 2", "1 20 2 3 1", "1 17 2 3 2", "2 5 2 1 1 4 2", "2 5 2 2 1 5 1 2",
                 "2 22 2 2 3", "2 16 4 3", "2 4 4", "2 1 5 4", "2 2 5 4",
                 "2 4 4", "2 4", "2 6", "2 8", "16"],
        "cols": ["5", "8", "3 5 9", "2 1 1 18", "5 2 1 2",
                 "3 1 2 1 2", "2 2 11 1 1", "2 17 1 1", "2 2 14 2 1", "2 2 12 1 1",
                 "1 2 2 2 7 1 1", "2 3 2 12 1 1", "2 3 2 1 7 2 1", "2 3 2 2 8 1", "2 3 2 2 8 1",
                 "2 2 3 2 4 2 1", "2 1 3 5 7 2 1", "2 2 5 13 1", "2 1 2 1 4 4 3 1", "2 1 2 1 2 4 2 2",
                 "2 1 2 4 2 2", "2 1 1 7 2 1", "2 1 1 2 8 1 2", "2 2 1 2 1 3 2 1 2", "2 1 3 1 1 1 3 2 1 2",
                 "2 1 2 1 1 3 3 2 2 2", "2 2 1 2 6 2 2 2 2", "2 1 2 2 2 6 2 1 2", "2 1 4 9 2 2 2", "2 1 4 2 8 2 2",
                 "1 1 5 1 3 2 2 2", "1 1 6 2 3 2 2 2", "1 1 4 2 2 2 2 2 2", "1 1 3 1 2 3 2 2 2", "2 2 3 1 8 2 2",
                 "2 1 2 1 10 1 2", "2 2 2 2 2 3", "2 2 2 2 5 1 2", "2 2 1 5 2", "2 2 2 3 1",
                 "2 1 7 2", "3 1 4 2", "3 2 2 2", "4 2 1 3", "3 6 3",
                 "3 4 3", "2 4", "2 3", "3 4", "6"]
    }

}

function PopulatePresets() {
    let preset = document.getElementById("preset")
    for (p in presets) {
        v = presets[p]
        let option = document.createElement("option")
        option.value = p
        option.textContent = v.name ? v.name : `${p} (${v.width}x${v.height})`
        preset.appendChild(option)
    }
}

function OnPresetBtn() {
    let preset = document.getElementById("preset").value;
    if (preset == "") {
        return;
    }
    let p = presets[preset];
    document.getElementById("dim-width").value = p.width;
    document.getElementById("dim-height").value = p.height;
    OnClearBtn();
    setTimeout(function(){
        p.rows.forEach((v, i) => {
            document.getElementById("r"+i).value = v;
        });
        p.cols.forEach((v, i) => {
            document.getElementById("c"+i).value = v;
        });
    });
}

// Slice is a reference to a column or row in the grid.
class Slice {
    constructor(solver, offset0, step, length) {
        this.solver = solver;
        this.g = solver.g;
        this.offset0 = offset0;
        this.step = step;
        this.length = length;
    }

    getX(i) {
        return this.g[this.offset0+this.step*i];
    }

    setX(i, val) {
        const o = this.offset0+this.step*i;
        const x = o % this.solver.width;
        const y = (o-x) / this.solver.width;
        this.solver.setXY(x,y,val);
    }

    // returns the first position >= start where a hole of size length
    // is found. If no such hole is found, return -1.
    findHoleStartingAt(start, length) {
        let found = 0;
        for (let i = start; i < this.length; i++) {
            if (this.getX(i) == STATE_X) {
                found = 0;
            } else {
                found += 1;
                if (found >= length) {
                    return i - found + 1;
                }
            }
        }
        return -1;
    }

    // returns the length of strip (consecutive same state cells)
    // starting at position i.
    stripLength(i) {
        let val = this.getX(i);
        let n=0;
        for (;i< this.length; i++) {
            if (this.getX(i) == val) {
                n++;
            } else {
                return n;
            }
        }
        return n;
    }

    indexOfNextSolid(start, bound = this.length) {
        for (let i = start; i < bound; i++) {
            if (this.getX(i) == STATE_SOLID) {
                return i;
            }
        }
        return -1;
    }

    // setSegment between i and j (exclusive) to state val.
    setSegment(i,j,val) {
        let changed = 0;
        for (let n = i; n < j; n++) {
            if (this.getX(n) != val) {
                this.setX(n, val);
                changed++;
            }
        }
        return changed;
    }

    reverse() {
        return new Slice(solver, this.offset0 + this.step * (this.length-1), -this.step, this.length);
    }
}

// Line contains all the information relating to a row / column,
// including the slice (of cells of STATE_?), segment constraints and
// known possible positions.
class Line {
    constructor(solver, name, len) {
        this.solver = solver
        this.name = name
        this.len = len
        this.lb = new Int16Array(len.length)
        this.ub = new Int16Array(len.length)
        this.done = new Int8Array(len.length)
        let i = parseInt(name.substr(1))
        if (name.charAt(0) == 'r') {
            this.slice = new Slice(solver, solver.width*i, 1, solver.width)
        } else {
            this.slice = new Slice(solver, i, solver.width, solver.height)
        }
    }


    // returns the leftmost possible position for each segment as a
    // integer array. Known leftmost position will be obeied. Return
    // false if a fit can not be found.
    fitLeftMost(slice, sLen, lb) {
        let cursor = 0          // cursor tracks a position in slice
        let i = 0               // i is an index of sLen / lb

        while (cursor < slice.length) {
            let lBound = i >= sLen.length ? slice.length : lb[i]
            if (lBound > cursor) {
                let nextSolid = slice.indexOfNextSolid(cursor, lBound)
                if (nextSolid == -1) {
                    cursor = lBound
                    continue
                }

                // we need to pull a segment here to cover nextSolid.
                let stripLen = slice.stripLength(nextSolid)
                do {
                    i--
                } while (i >= 0 && sLen[i] < stripLen)
                if (i < 0) {
                    this.solver.fail(`Can no segment to cover segment ${nextSolid} (${stripLen})`)
                    return false
                }
                // move cursor back to where the pulled segment was.
                // Then pull the segment to the place where it'll
                // cover nextSolid. Skip to next round because we may
                // have exposed a SOLID strip when pulling segment i.
                cursor = lb[i]
                lb[i] = nextSolid + stripLen - sLen[i]
                continue
            }
            // see if we can find a hole at cursor that's big enough.
            let hole = slice.findHoleStartingAt(cursor, sLen[i])
            if (hole == -1) {
                this.solver.fail("Can not find hole for segment "+ i)
                return false
            }
            while (hole + sLen[i] < slice.length &&
                   slice.getX(hole + sLen[i]) == STATE_SOLID) {
                hole += 1
            }
            lb[i] = hole
            cursor = hole + sLen[i] + 1 // 1 for the space between this and next
            i++
        }
        if (i < sLen.length) {
            this.solver.fail(`not enough space for segment ${i}`)
            return false
        }
        return true
    }

    // After deciding lb and ub, infer where we can mark something on
    // the (constraint) segment. This does not cover all the potential
    // cases.
    *inferSegments() {
        let slice = this.slice;

        let lb = this.lb;
        // ub is the real bound on the rightmost position. this.ub
        // counts from the right (for both segments, and slice), so we
        // need to flip both.
        let ub = this.ub.slice().reverse().map(x=>slice.length - x -1);

        for (let i = 0; i < lb.length; i++) {
            let l = lb[i];
            let u = ub[i];
            let len = this.len[i];
            let prevU = i>0? ub[i-1] : -1;
            let done = this.done[i] != 0;

            if (l + len - 1 > u) {
                this.solver.fail(`not enough space for segment ${i}`);
                return;
            }

            if (l > prevU+1 &&
                slice.setSegment(prevU+1, l, STATE_X) > 0) {
                yield;
            }

            if (done) { continue }
            this.solver.ui.highlightSegment(this.name, i);
            if (u-len+1 <= l+len-1 &&
                slice.setSegment(u-len+1, l+len, STATE_SOLID) > 0) {
                yield;
            }
            this.solver.ui.unhighlightSegment(this.name, i);
            if (u-l+1 == len) {
                this.done[i] = 1;
                this.solver.ui.dimSegment(this.name, i);
            }
        }
        if (ub[ub.length-1]+1 < slice.length &&
            slice.setSegment(ub[ub.length-1]+1, slice.length, STATE_X) > 0) {
            yield;
        }
    }

    // returns a list of segment indexes that lb <= start and ub >= end
    collidingSegments(lb, ub, start, end) {
        let result = [];
        for (let i = 0; i < lb.length; i++) {
            if (lb[i] <= start && ub[i] >= end) {
                result.push(i);
            }
        }
        return result;
    }

    // Make inference for strips (consecutive cells with same state).
    // Cases include:
    //
    // 1. "X X" can be marked "XXX" if all possible segments >= 2
    // 2. "?SSS?" can be marked "XSSSX" if all possible segments =3.
    // 3. (TODO) "X SS " can be marked "X SSS" if all potential segments >= 4.
    *inferStrips() {
        let slice = this.slice;
        let lb = this.lb;
        let ub = this.ub.slice().reverse().map(x=>slice.length - x -1);
        let len = this.len;
        let stripLen = 0;

        for (let i = 0; i < slice.length; i += stripLen) {
            stripLen = slice.stripLength(i);
            // this logic is never needed for slices at the edges
            if (i == 0 || i+stripLen == slice.length) {
                continue;
            }

            if (slice.getX(i) == STATE_EMPTY) {
                if (slice.getX(i-1) != STATE_X ||
                    slice.getX(i+stripLen) != STATE_X)  {
                    continue;
                }
                // find holes that's smaller than all potential
                // segments, and fill them with X.
                let seg = this.collidingSegments(lb, ub, i, i+stripLen-1);
                if (seg.length == 0) {continue;}
                let minLen = seg.reduce(
                    (m, i)=> m <= len[i]?m:len[i], len[seg[0]]);
                if (minLen <= stripLen) {
                    continue;
                }
                seg.forEach(i=>ui.highlightSegment(this.name, i));
                if (slice.setSegment(i, i+stripLen, STATE_X) > 0) {
                    yield;
                }
                seg.forEach(i=>ui.unhighlightSegment(this.name, i));
            } else if (slice.getX(i) == STATE_SOLID) {
                let seg = this.collidingSegments(lb, ub, i, i+stripLen-1);
                if (seg.length == 0) {continue;}
                if (seg.length == 1 && this.done[seg[0]] != 0) {
                    continue;
                }
                let maxLen = seg.reduce(
                    (m, i)=> m <= len[i]? len[i]:m, len[seg[0]]
                );
                if (maxLen != stripLen) {
                    continue;
                }
                seg.forEach(i=>ui.highlightSegment(this.name, i));
                if (slice.setSegment(i-1, i, STATE_X) +
                    slice.setSegment(i+stripLen, i+stripLen+1, STATE_X) > 0) {
                    yield;
                }
                seg.forEach(i=>ui.unhighlightSegment(this.name, i));
            }
        }
    }

    *infer() {
        let slice = this.slice;

        // special case for no segments.
        if (this.len.length == 0) {
            if (slice.setSegment(0, slice.length, STATE_X) > 0) {
                yield
            }
            return
        }

        // update left and right bounts
        if (!this.fitLeftMost(slice, this.len, this.lb)) {
            return
        }
        if (!this.fitLeftMost(slice.reverse(),
                              this.len.slice().reverse(), this.ub)) {
            return
        }
        yield* this.inferSegments()
        yield* this.inferStrips()
    }

    // returns an object that can be used later to recover the current
    // state.
    getState() {
        return {
            lb: this.lb.slice(),
            ub: this.ub.slice(),
            done: this.done.slice()
        }
    }

    // recover state to a previously stored one. The state object can
    // be used only once.
    setState(state) {
        this.lb = state.lb
        this.ub = state.ub
        this.done = state.done
    }
}

class Solver {
    constructor(ui) {
        this.ui = ui
        this.width = ui.width
        this.height = ui.height
        this.g = new Int8Array(this.width * this.height)

        let seg = ui.getSegments()
        this.lines = new Map()
        seg.rows.forEach((r, i) => {
            this.lines.set("r"+i, new Line(this, "r"+i, r))
        })
        seg.cols.forEach((c, i) => {
            this.lines.set("c"+i, new Line(this, "c"+i, c))
        })

        this.states = []         // pushed states for DPS search

        this.dirty = []
        for (let x = 0; x < this.width; x++) {
            this.dirty.push("c"+x)
        }
        for (let y = 0; y < this.height; y++) {
            this.dirty.push("r"+y)
        }
    }

    fail(message) {
        this.ui.log(message)
        this.failed = true
    }

    getXY(x,y) {
        return this.g[x + y*this.width]
    }

    setXY(x,y, val) {
        if (val == this.getXY(x,y)) {
            return
        }
        if (this.getXY(x,y) != STATE_EMPTY) {
            this.fail(`Inconsistent value at (${x},${y})`)
            return
        }
        this.g[x+y*this.width] = val
        this.ui.setXY(x,y,val)
        if (this.lineName.charAt(0) != "r") {
            this.markDirty("r" + y)
        }
        if (this.lineName.charAt(0) != "c") {
            this.markDirty("c" + x)
        }
    }

    markDirty(lineName) {
        let i = this.dirty.indexOf(lineName)
        if (i != -1) {
            this.dirty.splice(i, 1)
        }
        this.dirty.push(lineName)
    }

    pushState() {
        let state = {
            g: this.g.slice(),
            lines: new Map(),
            guessed: this.guessed
        }
        this.lines.forEach((v, key) => {
            state.lines.set(key, v.getState())
        })
        this.states.push(state)
        this.ui.color++
    }

    popState() {
        let state = this.states.pop()
        this.g = state.g
        this.guessed = state.guessed
        this.lines.forEach((line, key) => {
            line.setState(state.lines.get(key))
            line.slice.g = this.g
            line.done.forEach((done, i) => {
                if (done != 0) {
                    this.ui.dimSegment(line.name, i)
                } else {
                    this.ui.undimSegment(line.name, i)
                }
            })
        })
        this.dirty = [] // this is not saved, but should always be empty
        this.ui.clearColor()
        this.ui.color--
    }

    // make inference on lines until all lines are checked.
    *infer() {
        while (this.dirty.length > 0) {
            this.lineName = this.dirty.pop()
            this.ui.highlightLine(this.lineName)
            yield 0.1
            let line = this.lines.get(this.lineName)
            yield* line.infer()
            this.ui.unhilightLine(this.lineName)
            this.lineName = ""
            if (this.failed) {
                return
            }
        }
    }

    // picks an unwritten cell and make a guess. Returs object like
    // {x,y,val}. Returns null if everything has been filled.
    guess() {
        // do the stupid thing to find the first un-filled cell.
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.getXY(x,y) == STATE_EMPTY) {
                    return {
                        x,y,
                        val: STATE_SOLID
                    }
                }
            }
        }
    }

    *solve() {
        while(true) {
            yield* this.infer()
            if (this.failed) {
                if (this.states.length == 0) {
                    this.fail("No solution found")
                    return
                }
                this.failed = false
                this.popState()
                let g = this.guessed
                this.setXY(g.x, g.y, g.val == STATE_SOLID? STATE_X : STATE_SOLID)
                this.ui.highlightCell(g.x, g.y)
                yield
                this.ui.unhighlightCell(g.x, g.y)
                this.guessed = null
            } else {
                let g = this.guess()
                if (g == null) {
                    this.ui.log("done")
                    return
                }
                this.guessed = g
                this.pushState()
                this.setXY(g.x, g.y, g.val)
                this.ui.highlightCell(g.x,g.y)
                yield
                this.ui.unhighlightCell(g.x,g.y)
            }
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
        this.pause()
        while (!this.process.next().done) {}
        this.process = null
    }

    running() {
        return this.processID != null
    }
}

var runner

function requireRunner() {
    if (runner == null) {
        ui.clearDrawing()
        solver = new Solver(ui)
        runner = new Runner(solver.solve(), delay)
    }
}

function OnSolveBtn() {
    if (runner != null && runner.running()) {
        runner.pause()
        this.className = "play"
        this.title = "play"
        return
    }

    requireRunner()

    runner.start()
    this.className = "pause"
    this.title = "pause"
}

function OnNextBtn() {
    requireRunner()
    runner.next()
}

function OnRunAllBtn() {
    requireRunner()
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
    PopulatePresets()
    document.getElementById("btn-clear").addEventListener("click", OnClearBtn)
    document.getElementById("preset").addEventListener("change", OnPresetBtn)
    document.getElementById("btn-solve").addEventListener("click", OnSolveBtn)
    document.getElementById("btn-next").addEventListener("click", OnNextBtn)
    document.getElementById("btn-runall").addEventListener("click", OnRunAllBtn)
    document.getElementById("delay").addEventListener("change", OnDelayChange)
    OnDelayChange()
}

document.addEventListener("DOMContentLoaded", OnLoaded)
