class XYMultiplicationHistoryEntry {
    private _xy : XY;

    private _time : number;
    private _resultCorrect : boolean;
    private _timestamp : number;

    constructor(xy: XY, time: number, resultCorrect: boolean, timestamp: number) {
        this._xy = xy;
        this._time = time;
        this._resultCorrect = resultCorrect;
        this._timestamp = timestamp;
    }

    get xy(): XY {
        return this._xy;
    }

    get time(): number {
        return this._time;
    }

    get resultCorrect(): boolean {
        return this._resultCorrect;
    }

    get timestamp(): number {
        return this._timestamp;
    }

    serialize = () => {
        return {
            "time": this._time,
            "resultCorrect": this._resultCorrect,
            "timestamp" : this._timestamp,
            "xy": this.xy.serialize()
        };
    }

    // static unserialize = ( json : [string, any] ) => {
    //     return new XYMultiplicationHistoryEntry(
    //         XY.unserialize(json.xy),
    //         json.time,
    //         json.resultCorrect,
    //         json.timestamp
    //     );
    // }
}

class XYMultiplicationHistory {
    private _xy : XY;
    private _history : XYMultiplicationHistoryEntry[];

    constructor(xy: XY, history : XYMultiplicationHistoryEntry[] = []) {
        this._xy = xy;
        this._history = history;
    }

    get xy(): XY {
        return this._xy;
    }

    /**
     * Checks if two xys are the same. (4,5) != (5,4)
     * @param xy
     */
    equal = (xy: XY) : boolean => {
        return this._xy.x === xy.x && this._xy.y === xy.y;
    }

    registerResult = (resultOk: boolean, time: number) => {
        this._history.push(
            new XYMultiplicationHistoryEntry(
                this._xy,
                time,
                resultOk,
                Date.now()
            )
        );
    };

    get history(): XYMultiplicationHistoryEntry[] {
        return this._history;
    }

    serialize = () => {
        return {
            "xy": this._xy.serialize(),
            "history": this._history.map((historyEntry : XYMultiplicationHistoryEntry) => historyEntry.serialize())
        };
    }

    // unserialize = (json) => {
    //     return new XYMultiplicationHistory(
    //         XY.unserialize(json.xy),
    //         json.history.map( entry => XYMultiplicationHistoryEntry.unserialize(entry))
    //     );
    // }
}

class ScoreBoard {
    private _scoreboard : XYMultiplicationHistory[];

    constructor(xys : XY[]) {
        this._scoreboard = [];
        xys.forEach(xy => this._scoreboard.push(new XYMultiplicationHistory(xy)));
    }

    registerResult = (xy : XY, resultOk : boolean, time : number) => {
        const scoreHistory = this._scoreboard.find(_xy => _xy.equal(xy));
        if(undefined === scoreHistory) {
            throw new Error("Couldn't find score history for xy: " + xy.x + "," + xy.y);
        }

        scoreHistory.registerResult(resultOk, time);
    }


    get scoreboard(): XYMultiplicationHistory[] {
        return this._scoreboard;
    }
}

class XY {
    private readonly _x : number;
    private readonly _y : number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    result = () : number => {
        return this.x * this.y;
    }

    serialize = () : {x: number, y: number} => {
        return { "x": this._x, "y": this._y };
    }

    static unserialize = ( json: { x : number, y: number}) => {
        return new XY(json.x, json.y);
    }

    inverse = () : XY => {
        return new XY(this._y, this._x);
    }
}

class DataSet {
    protected dataset : XY[];
    protected currentPos : number;

    constructor(dataset: XY[]) {
        this.dataset = dataset;
        this.currentPos = -1;
    }

    next = () => {
        this.currentPos++;
        return this.dataset[ this.currentPos % this.dataset.length ];
    }
}

function createDataset(from : number, to : number) : XY[] {
    const results = [];

    for( let i = from; i <= to; i++) {
        for( let j = from; j <= to; j++) {
            results.push(new XY(i, j));
        }
    }

    return results;
}

function shuffle( items : XY[]) : XY[] {
    return items
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

class MultiplicationQuizWidget {
    protected container : HTMLElement;
    protected dataset : DataSet;
    protected scoreBoard: ScoreBoard;
    protected multiplicationTableWidget : MultiplicationTableWidget;

    protected currentQuestion : XY;

    protected questionElement : HTMLElement;
    protected answerBoxElement : HTMLInputElement;
    protected checkButtonElement : HTMLButtonElement;
    protected messageElement : HTMLElement;

    constructor(container : HTMLElement, dataset: DataSet, scoreBoard: ScoreBoard, multiplicationTableWidget : MultiplicationTableWidget) {
        this.container = container;
        this.dataset = dataset;
        this.scoreBoard = scoreBoard;
        this.multiplicationTableWidget = multiplicationTableWidget;

        this.createHtmlElements();
    }

    private createHtmlElements = () => {
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
    }

    checkButtonPressedHandler = () => {
        const answer = parseInt(this.answerBoxElement.value);

        if(isNaN(answer)) {
            this.clearAnswer();
        } else {
            const isCorrectAnswer = answer === this.currentQuestion.result();
            this.scoreBoard.registerResult(this.currentQuestion, isCorrectAnswer, 5);
            /* Register x * y and y * x, unless we have x=y and we have x * x */
            if(this.currentQuestion.x !== this.currentQuestion.y) {
                this.scoreBoard.registerResult(this.currentQuestion.inverse(), isCorrectAnswer, 5);
            }

            if(!isCorrectAnswer) {
                this.showIncorrectAnswerMessage(this.currentQuestion);
            } else {
                this.showCorrectAnswerMessage(this.currentQuestion);
                this.next();
            }

            this.multiplicationTableWidget.draw();
        }

        this.answerBoxElement.focus();
    }

    answerChangedHandler = (event : KeyboardEvent) => {
        if(event.key === 'Enter' || event.keyCode === 13) {
            this.checkButtonPressedHandler();
            return;
        }
        this.setMessage("");
    }

    next = () => {
        /* Select next multiplication */
        this.currentQuestion = this.dataset.next();
        /* Render the question */
        this.setQuestion(this.currentQuestion);
        this.clearAnswer();
    }

    private setQuestion = (xy: XY) => {
        this.questionElement.innerHTML = "<span class='number'>" + xy.x + "</span> x <span class='number'>" + xy.y + "</span> = ";
    }

    private clearAnswer() {
        this.answerBoxElement.value = "";
    }

    private setMessage = (message : string ) => {
        this.messageElement.innerHTML = message;
    }

    private showIncorrectAnswerMessage(currentQuestion: XY) {
        this.setMessage("Zły wynik");
        this.messageElement.classList.remove("result-correct");
        this.messageElement.classList.add("result-incorrect");
    }

    private showCorrectAnswerMessage(currentQuestion: XY) {
        this.setMessage("Poprawny wynik!");
        this.messageElement.classList.add("result-correct");
        this.messageElement.classList.remove("result-incorrect");
    }
}

class MultiplicationTableWidget {
    protected scoreboard : ScoreBoard;
    protected container : HTMLElement;
    protected table : HTMLTableElement;

    protected xy : XY;

    protected from : number;
    protected to : number;

    constructor(from : number, to : number, scoreboard: ScoreBoard, container : HTMLElement) {
        this.from = from;
        this.to = to;
        this.scoreboard = scoreboard;
        this.container = container;

        this.createTable();
        this.draw();
    }

    private createTable = () => {
        this.table = document.createElement("table") as HTMLTableElement;
        this.table.id = "scoreboard-widget";
        this.container.appendChild(this.table);

        /* Create header */
        const header = this.table.createTHead();
        const headerRow = header.insertRow();

        const topLeftHeaderCell = headerRow.insertCell();

        /* Create header */
        for(let x = this.from; x <= this.to; x++ ) {
            let cell = headerRow.insertCell();
            cell.innerText = "" + x;
        }

        /* Create rows */
        for(let y = this.from; y <= this.to; y++) {
            let yRow = this.table.insertRow();
            let rowLabelCell = yRow.insertCell();
            rowLabelCell.innerText = "" + y;

            for( let x = this.from; x <= this.to; x++) {
                let cell = yRow.insertCell();
                cell.innerText = "?";
                cell.id = this.getCellId(y, x);
            }
        }
    }

    draw = () => {
        this.scoreboard.scoreboard.forEach( multiplicationHistory => {
            let correctAnswers = 0;
            let incorrectAnswers = 0;
            multiplicationHistory.history.forEach( (entry :XYMultiplicationHistoryEntry) => {
                if(entry.resultCorrect) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            });



            const value = "" + correctAnswers + " / " + incorrectAnswers;
            const percCorrect = correctAnswers / (correctAnswers + incorrectAnswers);
            this.setCellValue(multiplicationHistory.xy, value, percCorrect);
        });
    }

    setCellValue = (xy : XY, value : string, percCorrect : number) => {
        const percCorrectRoundDown = Math.floor(percCorrect * 10) * 10;

        const cell = document.getElementById( this.getCellId(xy.x, xy.y));
        cell.innerHTML = value;
        cell.classList.forEach( theClass => cell.classList.remove(theClass));
        cell.classList.add("perc-" + percCorrectRoundDown);
    }

    getCellId = (x : number, y : number ) : string => {
        return "scoreboard-widget-cell-" + y + "-" + x;
    }
}

const from = 2;
const to = 9;
const xys = shuffle( createDataset(from, to) );

const container = document.getElementById("container");
const dataset = new DataSet(xys);
const scoreBoard = new ScoreBoard(xys);
const multiplicationTableWidget = new MultiplicationTableWidget(from, to, scoreBoard, container);
const multiplicationQuizWidget = new MultiplicationQuizWidget(
    container,
    dataset,
    scoreBoard,
    multiplicationTableWidget
);

multiplicationQuizWidget.next();