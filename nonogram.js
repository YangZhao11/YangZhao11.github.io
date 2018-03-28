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
        case 0:
            cell.className = "g"
            break
        case 1:
            cell.className = "g set c" + this.color
            break
        case 2:
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
}

class Solver {
    constructor(width, height) {
        this.width = width
        this.height = height
    }

    setSegments(rows, cols) {
        this.rows = rows
        this.cols = cols
    }

    *solve(ui) {
        ui.setXY(0,0, 1)
        yield true
        ui.setXY(0,1, 1)
        yield true
        ui.setXY(1,0, 2)
        yield true
        ui.pushState()
        ui.setXY(2,2,1)
        yield true
        for (let x = 0; x < this.width; x++) {
            ui.setXY(x,4,2)
            yield true
        }
        for (let y=0; y<this.height; y++) {
            ui.setXY(3,y,1)
            yield true
        }
        yield false
    }
}

var process
var delay

function runProcess() {
    if (process.next()) {
        setTimeout(runProcess, delay)
    }
}

function OnSolveBtn() {
    delay = parseInt(document.getElementById("delay").value)
    let s = new Solver(ui.width, ui.height)
    process = s.solve(ui)
    setTimeout(runProcess)
}


function OnLoaded() {
    document.getElementById("btn-clear").addEventListener("click", OnClearBtn)
    document.getElementById("btn-solve").addEventListener("click", OnSolveBtn)
}

document.addEventListener("DOMContentLoaded", OnLoaded)
