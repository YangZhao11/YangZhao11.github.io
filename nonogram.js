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
        return rows, cols
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
}

class Solver {
    constructor(ui) {
        this.ui = ui
        this.width = ui.width
        this.height = ui.height
        let rows, cols = ui.getSegments()
        this.rows = rows
        this.cols = cols
    }

    *solveLine(){

    }

    *solve() {
        for (let i = 0; i < 1000; i++) {
            let x = Math.floor(Math.random()*this.width)
            let y = Math.floor(Math.random()*this.height)
            let val = Math.floor(Math.random()*3)
            ui.setXY(x,y,val)
            yield
        }
    }
}

var process                     // generator
var delay                       // delay
var solver
var processID

function runProcess() {
    if (!process.next().done) {
        processID = setTimeout(runProcess, delay)
    }
}

function OnSolveBtn() {
    delay = parseInt(document.getElementById("delay").value)
    solver = new Solver(ui)
    process = solver.solve()
    processID = setTimeout(runProcess)
}


function OnLoaded() {
    document.getElementById("btn-clear").addEventListener("click", OnClearBtn)
    document.getElementById("btn-solve").addEventListener("click", OnSolveBtn)
}

document.addEventListener("DOMContentLoaded", OnLoaded)
