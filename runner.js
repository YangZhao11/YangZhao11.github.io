class Runner {
    constructor(process, delay) {
        this.process = process
        this.delay = delay
        this.processID = null
        this.step = 1
    }

    runIt() {
        let n = this.process.next()
        for (let i = 1; i < this.step; i++) {
            n = this.process.next()
            if (n.done) {
                break
            }
        }

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
