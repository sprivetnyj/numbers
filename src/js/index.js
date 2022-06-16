//================================================================================

import { audio } from './audio.js';
import { map } from './maps.js';

//================================================================================

const isMobile = { Android: function () { return navigator.userAgent.match(/Android/i); }, BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); }, iOS: function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); }, Opera: function () { return navigator.userAgent.match(/Opera Mini/i); }, Windows: function () { return navigator.userAgent.match(/IEMobile/i); }, any: function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); } };

vkBridge.send('VKWebAppInit');

//================================================================================

const canvas = document.querySelector('canvas');
canvas.getContext('2d');

const w = 360;
const h = 640;
const ratio = h / w;

canvas.width = w;
canvas.height = h;

let scale = 1;

//================================================================================

// Элементы HTML
const elmWrapper = document.querySelector('.wrapper');
const elmScreens = document.querySelectorAll('.screen');
const elmScreenStart = document.querySelector('.screen--start');
const elmScreenGame = document.querySelector('.screen--game');
const elmScreenEnd = document.querySelector('.screen--end');

const elmPlay = document.querySelector('.play');
const elmGroup = document.querySelector('.group');
const elmPost = document.querySelector('.post');
const elmInvite = document.querySelector('.invite');
const elmVolume = document.querySelector('.volume');

const preloader = document.querySelector('.preloader');

//================================================================================

let volume = true;

// vkBridge.send('VKWebAppStorageGet', { 'keys': ['key'] })
// 	.then(data => {
// 		if (!data.keys[0].value.length) data.keys[0].value = '0';
// 		lvl = data.keys[0].value;
// 		setTimeout(() => {
// 			preloader.classList.add('hidden');
// 			gameStart();
// 		}, 2000);
// 	});

preloader.classList.add('hidden');

// vkBridge.send("VKWebAppCheckNativeAds", { "ad_format": "interstitial" })
// .then(() => {
// 	vkBridge.send("VKWebAppShowNativeAds", { "ad_format": "interstitial" })
// });

// vkBridge.send("VKWebAppCheckNativeAds", { "ad_format": "reward" })
// .then(() => {
// 	vkBridge.send("VKWebAppShowNativeAds", { "ad_format": "reward", "use_waterfall": true })
// 		.then(() => {
// 		})
// 		.catch(() => {
// 		})
// });

//================================================================================

// setInterval(() => {
// 	c.clearRect(0, 0, canvas.width, canvas.height);
// }, 1000 / 60);

//================================================================================

let lvl = 0;
let lvlComplete = false;

let elmGrid, elmGridItems, elmGridItemsActive;

// Текущая выбранная цифра
let numbers;
let numbersAll = 0;
// Всего возможных ячеек в сетке
let numbersAim;
// Массив всех отмеченных ячеек
let numbersArray;

createLvl();

function createLvl() {
	const tiles = map[lvl].replace(/\r?\n/g, '').trim();
	let tilesRows = 0;

	for (let tile of tiles) {
		if (tile === '|') {
			tilesRows++;
		}
	}

	const tilesColumns = tiles.indexOf('|');

	let tilesSize;

	switch (tilesColumns) {
		case 3: tilesSize = 40; break;
		case 4: tilesSize = 30; break;
		case 5: tilesSize = 20; break;
	}
	let tilesHTML = `<div class="grid" style="--columns:${tilesColumns};--rows:${tilesRows};--width:340px;--height:${340 / tilesColumns * tilesRows}px;--size:${tilesSize}px">\n`

	for (let tile of tiles) {
		if (tile !== '|') {
			let number = '';
			let status = '';
			if (tile !== '+' && tile !== '-') {
				tile = Number(tile);
				number = tile;
				if (tile === 1) {
					status = 'start active';
				} else {
					status = 'end';
				}
			} else if (tile === '-') {
				status = 'hidden';
			}
			tilesHTML = tilesHTML.concat(`<div class="grid__item ${status}">${number}</div>\n`);
		}
	}

	tilesHTML = tilesHTML.concat('</div>');

	elmScreenGame.insertAdjacentHTML('afterbegin', tilesHTML);

	elmGrid = document.querySelector('.grid');
	elmGridItems = document.querySelectorAll('.grid__item');
	elmGridItemsActive = document.querySelectorAll('.grid__item.start');

	numbers = 1;
	numbersAim = 0;

	elmGridItems.forEach(elmGridItem => {
		if (!elmGridItem.classList.contains('hidden')) numbersAim++;
	});


	// Разные события, в зависимости от устройства
	if (isMobile.any()) {
		elmGridItemsActive.forEach(elmGridItemActive => {
			elmGridItemActive.addEventListener('touchstart', () => {
				numbersArray = [elmGridItemActive];
				document.addEventListener('touchmove', move);
				document.addEventListener('touchend', out);
			});
		});
	} else {
		elmGridItemsActive.forEach(elmGridItemActive => {
			elmGridItemActive.addEventListener('mousedown', () => {
				numbersArray = [elmGridItemActive];
				document.addEventListener('mousemove', move);
				document.addEventListener('mouseup', out);
			});
		});
	}
}

//================================================================================

newScreen(elmScreenGame);

document.addEventListener('click', (e) => {
	const el = e.target;
	if (el === elmPlay) {
		newScreen(elmScreenGame);
	} else if (el === elmGroup) {
		vkBridge.send('VKWebAppJoinGroup', { 'group_id': 213140436 });
	} else if (el === elmPost) {
		let postText = 10;
		vkBridge.send('VKWebAppShowWallPostBox', {
			'message': `Мой уровень в игре Game - ${postText}! Сможешь побить?\n\nOrby Games (vk.com/orby.games) - бесплатные игры для ВКонтакте. Присоединяйся!\n\n#игры #vkgames #directgames`,
			'attachments': 'https://vk.com/appID'
		})
	} else if (el === elmInvite) {
		vkBridge.send('VKWebAppShowInviteBox')
	}
	// else if (el === elmHome) {
	// 	if (volume) audio.Click.play();
	// 	newScreen(elmScreenStart);
	// } 
	else if (el === elmVolume) {
		volume = !volume;
		elmVolume.classList.toggle('off');
	} else {

	}
	if (el.closest('button')) {
		vkBridge.send("VKWebAppTapticImpactOccurred", { "style": "light" });
		animState([el.closest('button')], 200, 'scale');
		if (volume) audio.Click.play();
	}
});

//================================================================================

let el, prevEl, currentEl;
let numberLock = true;

// Отслеживание передвижение пальца/курсора
function move(e) {
	if (!lvlComplete) {
		if (isMobile.any()) {
			const myLocation = e.touches[0];
			const realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
			el = realTarget;
		} else {
			el = e.target;
		}
		// Если не выходим за пределы сетки
		if (el.closest('.grid')) {
			// Если попали не на первую ячейку
			if (!el.classList.contains('start') && !el.classList.contains('active')) {
				// Если не попали на скрытую ячейку
				if (!el.classList.contains('hidden')) {
					prevEl = numbersArray[numbersArray.length - 1].getBoundingClientRect();
					currentEl = el.getBoundingClientRect();
					// Если пошли наискосок
					if (currentEl.x < prevEl.x && currentEl.y > prevEl.y ||
						currentEl.x < prevEl.x && currentEl.y < prevEl.y ||
						currentEl.x > prevEl.x && currentEl.y > prevEl.y ||
						currentEl.x > prevEl.x && currentEl.y < prevEl.y) {
						out();
					} else {
						// Если конечный элемент совпадает с текущим
						if (el.classList.contains('end')) {
							if (el.textContent == numbers + 1) {
								addNumber();
								// Если есть еще одна точка старта
								if (elmGrid.querySelectorAll('.start').length > 1) {
									numbersArray.forEach(number => {
										number.classList.add('completed');
										numbersAll++;
									});
								}
								// Если один из путей завершен
								if (elmGrid.querySelectorAll('.end.completed').length) {
									if (isMobile.any()) {
										document.removeEventListener('touchmove', move);
									} else {
										document.removeEventListener('mousemove', move);
									}
								}
								setTimeout(() => {
									if (!lvlComplete) {
										vkBridge.send("VKWebAppTapticImpactOccurred", { "style": "medium" });
										confetti({
											particleCount: 50,
											decay: scale / 1.5,
											ticks: 40,
											spread: 360,
											gravity: 0,
											scalar: scale,
											colors: ['#fe5cd7'],
											origin: {
												x: (currentEl.x + 41.25 * scale) / window.innerWidth,
												y: (currentEl.y + 41.25 * scale) / window.innerHeight
											}
										});
									}
								}, 1);
							} else {
								if (numberLock) {
									numbersArray.forEach(number => {
										number.classList.add('error', 'delay');
										setTimeout(() => {
											number.classList.remove('error');
										}, 200);
										setTimeout(() => {
											number.classList.remove('delay');
										}, 400);
									});
								}
								numberLock = false;
							}
						} else {
							if (numberLock) {
								addNumber();
								el.textContent = numbers;
							} else {
								out();
							}
						}
					}
				} else {
					out();
				}
			}
			// Если вернулись на предыдущий элемент по порядку
			if (el.classList.contains('active')) {
				if (numbers - 1 == el.textContent) {
					elmGridItems.forEach(elmGridItem => {
						if (elmGridItem.textContent == numbers) {
							// Если до этого был элемент, который был равен конечному
							if (numbersArray.includes(elmGridItem)) {
								setTimeout(() => {
									numbers--;
									numberLock = true;
									// Убираем все возможные классы границ
									elmGridItem.classList.remove('active', 'top', 'left', 'right', 'bottom');
									numbersArray.splice(numbersArray.indexOf(elmGridItem), 1);
									// Обнуляем текст, если не на конечном элементе
									if (!elmGridItem.classList.contains('end')) elmGridItem.textContent = '';
								}, 1);
							}
						}
					});
				} else if (numbers > el.textContent) {
					out();
				}
			}
			if (elmGrid.querySelectorAll('.active').length >= numbersAim) {
				if (!lvlComplete) {
					lvl++;
					setTimeout(() => {
						if (isMobile.any()) {
							document.removeEventListener('touchmove', move);
						} else {
							document.removeEventListener('mousemove', move);
						}
						elmGrid.remove();
						createLvl();
						lvlComplete = false;
					}, 2000);
					lvlComplete = true;
					const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
					confetti({
						particleCount: 100,
						angle: 60,
						spread: 90,
						gravity: 1.5,
						origin: { x: 0, y: 0.6 },
						colors: colors
					});
					confetti({
						particleCount: 100,
						angle: 120,
						spread: 90,
						gravity: 1.5,
						origin: { x: 1, y: 0.6 },
						colors: colors
					});
					vkBridge.send("VKWebAppTapticImpactOccurred", { "style": "heavy" });
				}
			}
		} else {
			out();
		}
	}
}

//================================================================================

// Создание новой цифры
function addNumber() {
	// Проверка стороны нового элемента
	if (currentEl.y > prevEl.y) el.classList.add('top');
	if (currentEl.y < prevEl.y) el.classList.add('bottom');
	if (currentEl.x > prevEl.x) el.classList.add('left');
	if (currentEl.x < prevEl.x) el.classList.add('right');
	numbersArray.push(el);
	el.classList.add('active');
	numbers++;
}

//================================================================================

// При неверной позиции, выходе за сетку или при отпускании пальца/курсора
function out() {
	if (!lvlComplete) {
		numberLock = true;
		numbers = 1;
		numbersArray.forEach(numberItem => {
			numberItem.classList.remove('error');
		});
		numbersArray = [];
		if (isMobile.any()) {
			document.removeEventListener('touchmove', move);
		} else {
			document.removeEventListener('mousemove', move);
		}
		elmGridItems.forEach(elmGridItem => {
			// Убираем все возможные классы границ
			if (!elmGridItem.classList.contains('completed')) {
				elmGridItem.classList.remove('active', 'top', 'left', 'right', 'bottom');
			}
			if (elmGridItem.classList.contains('start')) elmGridItem.classList.add('active');
			// Обнуляем текст, если не на конечном элементе и не на первом элементе
			if (!elmGridItem.classList.contains('start') && !elmGridItem.classList.contains('end') && !elmGridItem.classList.contains('completed')) {
				elmGridItem.textContent = '';
			}
		});
	}
}

//================================================================================

function animState(elements, delay, className) {
	elements.forEach(element => {
		element.classList.add(className);
		setTimeout(() => {
			element.classList.remove(className);
		}, delay);
	});
}

//================================================================================

function newScreen(newScreen) {
	elmScreens.forEach(screen => {
		let oldScreenSide = 'hidden--left';
		let newScreenSide = 'hidden--right';
		if (newScreen.classList.contains('hidden--left')) {
			oldScreenSide = 'hidden--right';
			newScreenSide = 'hidden--left';
		}
		if (!screen.classList.contains('hidden')) {
			// toggleClasses([screen], 'add', ['hidden', oldScreenSide], 500);
			toggleClasses([screen], 'add', ['hidden', oldScreenSide], 0);
		} else if (screen === newScreen) {
			// toggleClasses([screen], 'remove', ['hidden', newScreenSide], 500);
			toggleClasses([screen], 'remove', ['hidden', newScreenSide], 0);
		}
	});
}

//================================================================================

function toggleClasses(elements, state, classArray, delay = 0) {
	setTimeout(() => {
		elements.forEach(el => {
			classArray.forEach(classIndex => {
				if (state === 'add') {
					el.classList.add(classIndex);
				} else {
					el.classList.remove(classIndex);
				}
			});
		});
	}, delay);
}

//================================================================================

function getNoun(number) {
	let n = Math.abs(number);
	n %= 100;
	if (n >= 5 && n <= 20) return 'подсказок';
	n %= 10;
	if (n === 1) return 'подсказка';
	if (n >= 2 && n <= 4) return 'подсказки';
	return 'подсказок';
}

//================================================================================

function resizeCanvas() {
	const currentRatio = window.innerHeight / window.innerWidth;
	if (ratio > currentRatio) {
		canvas.width = window.innerHeight / ratio;
		canvas.height = window.innerHeight;
		scale = window.innerHeight / h;
		elmWrapper.style = `--scale:${scale}`;
	} else {
		canvas.width = window.innerWidth;
		canvas.height = window.innerWidth * ratio;
		scale = window.innerWidth / w;
		elmWrapper.style = `--scale:${scale}`;
	}
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

//================================================================================
