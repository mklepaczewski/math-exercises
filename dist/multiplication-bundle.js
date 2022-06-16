/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*******************************!*\
  !*** ./src/multiplication.ts ***!
  \*******************************/
class XYMultiplicationHistoryEntry {
    constructor(xy, time, resultCorrect, timestamp) {
        this.serialize = () => {
            return {
                "time": this._time,
                "resultCorrect": this._resultCorrect,
                "timestamp": this._timestamp,
                "xy": this.xy.serialize()
            };
        };
        this._xy = xy;
        this._time = time;
        this._resultCorrect = resultCorrect;
        this._timestamp = timestamp;
    }
    get xy() {
        return this._xy;
    }
    get time() {
        return this._time;
    }
    get resultCorrect() {
        return this._resultCorrect;
    }
    get timestamp() {
        return this._timestamp;
    }
}
class XYMultiplicationHistory {
    constructor(xy, history = []) {
        /**
         * Checks if two xys are the same. (4,5) != (5,4)
         * @param xy
         */
        this.equal = (xy) => {
            return this._xy.x === xy.x && this._xy.y === xy.y;
        };
        this.registerResult = (resultOk, time) => {
            this._history.push(new XYMultiplicationHistoryEntry(this._xy, time, resultOk, Date.now()));
        };
        this.serialize = () => {
            return {
                "xy": this._xy.serialize(),
                "history": this._history.map((historyEntry) => historyEntry.serialize())
            };
        };
        this._xy = xy;
        this._history = history;
    }
    get xy() {
        return this._xy;
    }
    get history() {
        return this._history;
    }
}
class ScoreBoard {
    constructor(xys) {
        this.registerResult = (xy, resultOk, time) => {
            const scoreHistory = this._scoreboard.find(_xy => _xy.equal(xy));
            if (undefined === scoreHistory) {
                throw new Error("Couldn't find score history for xy: " + xy.x + "," + xy.y);
            }
            scoreHistory.registerResult(resultOk, time);
        };
        this._scoreboard = [];
        xys.forEach(xy => this._scoreboard.push(new XYMultiplicationHistory(xy)));
    }
    get scoreboard() {
        return this._scoreboard;
    }
}
class XY {
    constructor(x, y) {
        this.result = () => {
            return this.x * this.y;
        };
        this.serialize = () => {
            return { "x": this._x, "y": this._y };
        };
        this.inverse = () => {
            return new XY(this._y, this._x);
        };
        this._x = x;
        this._y = y;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
}
XY.unserialize = (json) => {
    return new XY(json.x, json.y);
};
class DataSet {
    constructor(dataset) {
        this.next = () => {
            this.currentPos++;
            return this.dataset[this.currentPos % this.dataset.length];
        };
        this.dataset = dataset;
        this.currentPos = -1;
    }
}
function createDataset(from, to) {
    const results = [];
    for (let i = from; i <= to; i++) {
        for (let j = from; j <= to; j++) {
            results.push(new XY(i, j));
        }
    }
    return results;
}
function shuffle(items) {
    return items
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}
class MultiplicationQuizWidget {
    constructor(container, dataset, scoreBoard, multiplicationTableWidget) {
        this.createHtmlElements = () => {
            this.questionElement = document.createElement("div");
            this.questionElement.id = "question";
            this.answerBoxElement = document.createElement("input");
            this.answerBoxElement.id = "answer-box";
            this.answerBoxElement.setAttribute("pattern", "[0-9]*");
            this.answerBoxElement.setAttribute("type", "number");
            this.answerBoxElement.setAttribute("inputmode", "numeric");
            this.answerBoxElement.addEventListener('keypress', this.answerChangedHandler);
            this.checkButtonElement = document.createElement("button");
            this.checkButtonElement.id = "check-button";
            this.checkButtonElement.innerText = "Sprawdź!";
            this.checkButtonElement.addEventListener('click', this.checkButtonPressedHandler);
            this.messageElement = document.createElement("div");
            this.messageElement.id = "result-message";
            this.container.appendChild(this.questionElement);
            this.container.appendChild(this.answerBoxElement);
            this.container.appendChild(this.checkButtonElement);
            this.container.appendChild(this.messageElement);
        };
        this.checkButtonPressedHandler = () => {
            const answer = parseInt(this.answerBoxElement.value);
            if (isNaN(answer)) {
                this.clearAnswer();
            }
            else {
                const isCorrectAnswer = answer === this.currentQuestion.result();
                this.scoreBoard.registerResult(this.currentQuestion, isCorrectAnswer, 5);
                /* Register x * y and y * x, unless we have x=y and we have x * x */
                if (this.currentQuestion.x !== this.currentQuestion.y) {
                    this.scoreBoard.registerResult(this.currentQuestion.inverse(), isCorrectAnswer, 5);
                }
                if (!isCorrectAnswer) {
                    this.showIncorrectAnswerMessage(this.currentQuestion);
                }
                else {
                    this.showCorrectAnswerMessage(this.currentQuestion);
                    this.next();
                }
                this.multiplicationTableWidget.draw();
            }
            this.answerBoxElement.focus();
        };
        this.answerChangedHandler = (event) => {
            if (event.key === 'Enter' || event.keyCode === 13) {
                this.checkButtonPressedHandler();
                return;
            }
            this.setMessage("");
        };
        this.next = () => {
            /* Select next multiplication */
            this.currentQuestion = this.dataset.next();
            /* Render the question */
            this.setQuestion(this.currentQuestion);
            this.clearAnswer();
        };
        this.setQuestion = (xy) => {
            this.questionElement.innerHTML = "<span class='number'>" + xy.x + "</span> x <span class='number'>" + xy.y + "</span> = ";
        };
        this.setMessage = (message) => {
            this.messageElement.innerHTML = message;
        };
        this.container = container;
        this.dataset = dataset;
        this.scoreBoard = scoreBoard;
        this.multiplicationTableWidget = multiplicationTableWidget;
        this.createHtmlElements();
    }
    clearAnswer() {
        this.answerBoxElement.value = "";
    }
    showIncorrectAnswerMessage(currentQuestion) {
        this.setMessage("Zły wynik");
        this.messageElement.classList.remove("result-correct");
        this.messageElement.classList.add("result-incorrect");
    }
    showCorrectAnswerMessage(currentQuestion) {
        this.setMessage("Poprawny wynik!");
        this.messageElement.classList.add("result-correct");
        this.messageElement.classList.remove("result-incorrect");
    }
}
class MultiplicationTableWidget {
    constructor(from, to, scoreboard, container) {
        this.createTable = () => {
            this.table = document.createElement("table");
            this.table.id = "scoreboard-widget";
            this.container.appendChild(this.table);
            /* Create header */
            const header = this.table.createTHead();
            const headerRow = header.insertRow();
            const topLeftHeaderCell = headerRow.insertCell();
            /* Create header */
            for (let x = this.from; x <= this.to; x++) {
                let cell = headerRow.insertCell();
                cell.innerText = "" + x;
            }
            /* Create rows */
            for (let y = this.from; y <= this.to; y++) {
                let yRow = this.table.insertRow();
                let rowLabelCell = yRow.insertCell();
                rowLabelCell.innerText = "" + y;
                for (let x = this.from; x <= this.to; x++) {
                    let cell = yRow.insertCell();
                    cell.innerText = "?";
                    cell.id = this.getCellId(y, x);
                }
            }
        };
        this.draw = () => {
            this.scoreboard.scoreboard.forEach(multiplicationHistory => {
                let correctAnswers = 0;
                let incorrectAnswers = 0;
                multiplicationHistory.history.forEach((entry) => {
                    if (entry.resultCorrect) {
                        correctAnswers++;
                    }
                    else {
                        incorrectAnswers++;
                    }
                });
                const value = "" + correctAnswers + " / " + incorrectAnswers;
                const percCorrect = correctAnswers / (correctAnswers + incorrectAnswers);
                this.setCellValue(multiplicationHistory.xy, value, percCorrect);
            });
        };
        this.setCellValue = (xy, value, percCorrect) => {
            const percCorrectRoundDown = Math.floor(percCorrect * 10) * 10;
            const cell = document.getElementById(this.getCellId(xy.x, xy.y));
            cell.innerHTML = value;
            cell.classList.forEach(theClass => cell.classList.remove(theClass));
            cell.classList.add("perc-" + percCorrectRoundDown);
        };
        this.getCellId = (x, y) => {
            return "scoreboard-widget-cell-" + y + "-" + x;
        };
        this.from = from;
        this.to = to;
        this.scoreboard = scoreboard;
        this.container = container;
        this.createTable();
        this.draw();
    }
}
const from = 2;
const to = 9;
const xys = shuffle(createDataset(from, to));
const container = document.getElementById("container");
const dataset = new DataSet(xys);
const scoreBoard = new ScoreBoard(xys);
const multiplicationTableWidget = new MultiplicationTableWidget(from, to, scoreBoard, container);
const multiplicationQuizWidget = new MultiplicationQuizWidget(container, dataset, scoreBoard, multiplicationTableWidget);
multiplicationQuizWidget.next();

/******/ })()
;
//# sourceMappingURL=multiplication-bundle.js.map