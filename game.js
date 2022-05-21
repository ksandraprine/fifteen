"use strict;"

class Game {
	_canvas = document.getElementById("canvas");
	_ctx = canvas.getContext('2d');
	_sizeField = this._canvas.clientWidth; // Размер поля
	_countSquaresRow = 4; // Количество цыфр в строке
	_paddingSquare = 2; // Толщина отступов вокруг квадратов
	_sizeSquare = (this._sizeField / this._countSquaresRow ); // Размер квадрата
	_numbersForSquares = []; // Номера квадратов
	_coordinateNull = []; // Координаты пустого квадрата
	_countSteps = 0; // Количество ходов
	_numberGame = 0; // Номер игры
	_timer; // Таймер
	_buttonStart = document.getElementById("start"); // Кнопка запуска
	_buttonRestart = document.getElementById("restart"); // Кнопка перезапуска
	_buttonFinish = document.getElementById("finish"); // Кнопка завершения
	_slider = document.getElementById("slider"); // Слайдер размерности поля
	_switch = document.getElementById('switch'); // Переключатель анимации
	_isWin = false; // Флаг победы
	_isAnimate = true; // Необходимость анимации
	_isAnimated = false; // Происходит анимация в данное время или нет
	_isStarted = false; // Запущена ли игра

	constructor() {
		this._ctx.textBaseline = "middle";
        this._ctx.textAlign = "center";
        this._ctx.font = `${240 / this._countSquaresRow}px Comic Sans MS, cursive`;
		this._canvas.addEventListener('click', this.clickHandler.bind(this));
		this._buttonStart.addEventListener('click', this.start.bind(this));
		this._buttonRestart.addEventListener('click', this.restart.bind(this));
		this._buttonFinish.addEventListener('click', this.finish.bind(this));
		this._switch.addEventListener('click', this.onSwitchIsAnimate.bind(this));
		this._slider.oninput = this.onSlideDimension.bind(this);
		this._numbersForSquares = this.fillSquaresNumbers(false);
		this.drawField();
	}

	/**
	 * Генерация цифр для квадратов
	 * @param {Boolean} shuffle - перемешивание
	 */
	generateNumbers(shuffle) {
		const array = Array.from( { length: Math.pow(this._countSquaresRow, 2) - 1}, (v, i) => i+1);
		array.push(0);
		if (shuffle){
			return array.sort(() => Math.random() - 0.5);
		}
		return array;
	}

	/**
	 * Заполнение квадратов цифрами
	 * @param {Boolean} shuffle - перемешивание
	 */
	fillSquaresNumbers(shuffle = true) {
		const numbers = this.generateNumbers(shuffle);
		const array = [];
		for (let i = 0; i < this._countSquaresRow; i++) {
			array.push(numbers.slice(i * this._countSquaresRow, i * this._countSquaresRow + this._countSquaresRow));
		}
		return array;
	}

	/**
	 * Очистка поля
	 */
	clearField() {
		this._ctx.fillStyle = "#d9d9d9";
		this._ctx.fillRect(0, 0, this._sizeField, this._sizeField);
	}

	/**
	 * Отрисовка квадратов на поле
	 */
	drawField() {
		this.clearField();
		for (let i = 0; i < this._numbersForSquares.length; i++) {
			for (let j = 0; j < this._numbersForSquares.length; j++) {
				if (this._numbersForSquares[i][j] === 0) {
					this._coordinateNull = [i, j];
					continue;
				}
				this.drawSquare(i, j);
			}
		}
	}

	/**
	 * Отрисовка квадрата и его цифры
	 * @param {Number} x - индекс квадрата в строке
	 * @param {Number} y - индекс квадрата в столбце
	 * @param {Number} offsetX - смещение при анимации по X
	 * @param {Number} offsetY - смещение при анимации по Y
	 */
	drawSquare(x, y, offsetX = 0, offsetY = 0) {
		this._ctx.fillStyle = this._isWin ? "#00a550" : this._isStarted ? "#322a61" : "#828282";
				this._ctx.fillRect(
					y * this._sizeSquare + this._paddingSquare + offsetY, 
					x * this._sizeSquare + this._paddingSquare + offsetX, 
					this._sizeSquare - (2 * this._paddingSquare), 
					this._sizeSquare - (2 * this._paddingSquare)
				);
				this._ctx.fillStyle = this._isStarted ? "#FFF" : "#d9d9d9";
				this._ctx.fillText(
					this._numbersForSquares[x][y], 
					y * this._sizeSquare + (this._sizeSquare / 2) + offsetY, 
					x * this._sizeSquare + (this._sizeSquare / 2) + (this._sizeSquare / 15) + offsetX
				);
	}

	/**
	 * Обработка клика по полю
	 * @param {Event} event 
	 */
	clickHandler(event) {
		let modX = event.offsetX % this._sizeSquare;  // Координаты внутри квадрата с отступами
		let modY = event.offsetY % this._sizeSquare;
		let edge = this._sizeSquare - this._paddingSquare; // Координаты правой и нижней границы квадрата
		if (modX < this._paddingSquare || modX > edge || 
			modY < this._paddingSquare || modY > edge ||
			event.offsetX > this._sizeField || event.offsetX < 0 ||
			event.offsetY > this._sizeField || event.offsetY < 0 || 
			this._isWin || this._isAnimated || !this._isStarted) {
			return;
		}

		const y = Math.floor(event.offsetX / this._sizeSquare);
		const x = Math.floor(event.offsetY / this._sizeSquare);
		
		if (this._numbersForSquares[x][y] === 0){
			return;
		}

		this.moveSquare(x, y);
	}

	/**
	 * Передвижение квадратов (с анимацией или без)
	 * Проверка на нахождение рядом с пустым квадратом
	 * @param {Number} x - индекс квадрата в строке
	 * @param {Number} y - индекс квадрата в столбце
	 */
	moveSquare(x, y) {
		const horizontalOffset = this._coordinateNull[0] - x;
		const verticalOffset = this._coordinateNull[1] - y;

		if (Math.abs(horizontalOffset) + Math.abs(verticalOffset) > 1) {
			return;
		}

		if (this._isAnimate){
			this.animation(x, y, horizontalOffset, verticalOffset).then(() => {
				this.exchangeWithNull(x, y);
			});
		} else {
			this.exchangeWithNull(x, y);
			this.drawField();
		}

		this.chageSteps();
	}

	/**
	 * Обмен выбранного квадрата с пустым
	 * @param {Number} x - индекс квадрата в строке
	 * @param {Number} y - индекс квадрата в столбце
	 */
	exchangeWithNull(x, y) {
		this._numbersForSquares[this._coordinateNull[0]][this._coordinateNull[1]] = this._numbersForSquares[x][y];
		this._numbersForSquares[x][y] = 0;
		this._coordinateNull = [x, y];

		if(this._numbersForSquares[this._countSquaresRow - 1][this._countSquaresRow - 1] === 0){
			this.checkWin();
		}
	}

	/**
	 * Вывод количества ходов
	 */
	chageSteps() {
		this._countSteps++;
		const container = document.getElementById('steps');
		container.textContent = this._countSteps;
	}

	/**
	 * Таймер
	 */
	startTimer() {
		const initialTime = Math.floor(Date.now() / 1000);
		this._timer = setInterval(() => {
			const time = Math.floor(Date.now() / 1000) - initialTime;
			const container = document.getElementById('timer');
			container.textContent = `${Math.floor(time / 60)}:${Math.floor(time % 60) < 10 ? "0" + Math.floor(time % 60) : Math.floor(time % 60)}`
		}, 200);
		
	}

	/**
	 * Анимация
	 * @param {Number} x - индекс квадрата в строке
	 * @param {Number} y - индекс квадрата в столбце
	 * @param {Number} horizontalOffset - смещение по X
	 * @param {Number} verticalOffset - смещение по Y
	 * @returns 
	 */
	animation(x, y, horizontalOffset, verticalOffset) {
		return new Promise((resolve, reject) => {
			this._isAnimated = true;
			let countCycles = 0;
			let offsetX = 0;
			let offsetY = 0;
			let moving = setTimeout(function tick() {
				this._ctx.fillStyle = "#d9d9d9";
				this._ctx.fillRect(y * this._sizeSquare + offsetY, x * this._sizeSquare + offsetX, this._sizeSquare, this._sizeSquare);
				offsetX = horizontalOffset * countCycles;
				offsetY = verticalOffset * countCycles;
				this.drawSquare(x, y, offsetX, offsetY);
				if (countCycles < this._sizeSquare){
					moving = setTimeout(tick.bind(this), 10);
					countCycles = countCycles + this._sizeSquare / 25;
					return;
				}
				this._isAnimated = false;
				resolve(true);
			}.bind(this), 10);
		});
	}

	/**
	 * Проверка сценария победы
	 */
	checkWin() {
		let checkingArray = [];
		for (let i = 0; i < this._countSquaresRow; i++){
			checkingArray = checkingArray.concat(this._numbersForSquares[i]);
		}
		for (let i = 0; i < Math.pow(this._countSquaresRow, 2) - 1; i++){
			if (checkingArray[i] !== i + 1) {
				return;
			}
		}
		this._isWin = true;
		clearInterval(this._timer);
		this.drawField();
		this.addResult();
	}

	/**
	 * Добавление результата игры в таблицу
	 */
	addResult() {
		const data = [
			this._numberGame,
			this._countSteps,
			document.getElementById('timer').textContent,
			this._isWin ? 'Победа' : 'Поражение',
			`${this._countSquaresRow} x ${this._countSquaresRow}`
		];
		const container = document.getElementById('table_body');
		const row = document.createElement('tr');
		if (this._numberGame % 2 === 0){
			row.classList.add('even');
		}
		
		for (let i = 0; i < data.length; i++) {
			const cell = document.createElement('td');
			if (i === 3){
				cell.style = `color: ${this._isWin ? "#00a550" : "#D00"}`;
			}
			cell.textContent = data[i];
			row.appendChild(cell);
		}

		container.appendChild(row);
	}

	/**
	 * Запуск игры
	 */
	start() {
		if (this._isStarted === false){
			this._numbersForSquares = this.fillSquaresNumbers();
			this._isStarted = true;
			this._numberGame++;
			this.drawField();
			this.startTimer();
			this._buttonStart.classList.add('hide');
			this._buttonRestart.classList.remove('hide')
			this._buttonFinish.classList.remove('hide');
			this._slider.disabled = true;
		}
	}

	/**
	 * Перезапуск игры
	 */
	restart() {
		if (!this._isWin) {
			this.addResult();
		}
		this._isWin = false;
		this._numbersForSquares = this.fillSquaresNumbers();
		clearInterval(this._timer);
		this.startTimer();
		this._countSteps = 0;
		this._numberGame++;
		const container = document.getElementById('steps');
		container.textContent = this._countSteps;
		this.drawField();
	}

	/**
	 * Завершение игры
	 */
	finish() {
		this._buttonStart.classList.remove('hide');
		this._buttonRestart.classList.add('hide')
		this._buttonFinish.classList.add('hide');
		if (!this._isWin) {
			this.addResult();
		}
		this._isWin = false;
		this._isStarted = false;
		this._numbersForSquares = this.fillSquaresNumbers(false);
		this._countSteps = 0;
		const container = document.getElementById('steps');
		container.textContent = this._countSteps;
		const timer = document.getElementById('timer');
		timer.textContent = "0:00";
		clearInterval(this._timer);
		this.drawField();
		this._slider.disabled = false;
	}

	/**
	 * Изменение размерности поля
	 */
	onSlideDimension(event) {
		this._countSquaresRow = Number(event.currentTarget.value);
		document.getElementById('dimension').textContent = this._countSquaresRow + ' x ' + this._countSquaresRow;

		this._sizeSquare = (this._sizeField / this._countSquaresRow );
		this._ctx.font = `${240 / this._countSquaresRow}px Comic Sans MS, cursive`;
		this._numbersForSquares = this.fillSquaresNumbers(false);
		this.drawField();
	}

	/**
	 * Управление анимацией
	 */
	onSwitchIsAnimate(event) {
		this._switch.classList.toggle('switch-on');
		this._isAnimate = !this._isAnimate;
	}
}

new Game();