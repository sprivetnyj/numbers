//================================================================================

import { audio } from './audio.js';
import { map } from './maps.js';
import { paths } from './paths.js';

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

const elmPlay = document.querySelector('.play');
const elmGroup = document.querySelector('.group');
const elmPost = document.querySelector('.post');
const elmInvite = document.querySelector('.invite');
const elmVolume = document.querySelector('.volume');

const elmHome = document.querySelector('.home');
const elmLvl = document.querySelector('.lvl');
const elmBack = document.querySelector('.back');
const elmHint = document.querySelector('.hint');

const preloader = document.querySelector('.preloader');

//================================================================================

let volume = true;

let ad = -1;

let lvl;
let userHelp;

vkBridge.send('VKWebAppStorageGet', { 'keys': ['lvlKey1', 'helpKey1'] })
	.then(data => {
		console.log(data);
		if (!data.keys[0].value.length) data.keys[0].value = '0';
		if (!data.keys[1].value.length) data.keys[1].value = '3';
		console.log(data);
		lvl = data.keys[0].value;
		userHelp = data.keys[1].value;
		setTimeout(() => {
			preloader.classList.add('hidden');
			gameStart();
		}, 2000);
	});

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

// a b c d e f g h i j  k  l  m  n  o  p  q  r  s  t  u  v  w  x  y  z  0  1  2  3
// 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
const digits = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3'];

//================================================================================

function gameStart() {
	createLvl(lvl);
	if (userHelp !== 'null') {
		elmHint.firstElementChild.textContent = userHelp;
	} else {
		elmHint.classList.add('show');
	}
}

//================================================================================

let lvlComplete = false;

let elmGrid, elmGridItems, elmGridItemsActive;

let numbers, numbersAim, numbersArray;
let numbersAll = 0;
let numbersPaths = [];

let orderEl = [];
let index;
let helpKey;

function createLvl(number) {
	ad++;
	if (ad > 0) {
		if (ad % 3 === 0) {
			vkBridge.send("VKWebAppCheckNativeAds", { "ad_format": "interstitial" })
				.then(() => {
					vkBridge.send("VKWebAppShowNativeAds", { "ad_format": "interstitial" })
				})
		}
	}

	orderEl = [];

	if (number >= 55) {
		index = Math.floor(Math.random() * (55 - 20) + 20);
	} else {
		index = number;
	}
	elmLvl.textContent = number + 1;

	const tiles = map[index].replace(/\r?\n/g, '').trim();
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
		case 6: tilesSize = 16; break;
	}
	let tilesHTML = `<div class="grid" style="--columns:${tilesColumns};--rows:${tilesRows};--width:340px;--height:${340 / tilesColumns * tilesRows}px;--size:${tilesSize}px">\n`

	for (let tile of tiles) {
		if (tile !== '|') {
			let number = '';
			let status = '';
			if (tile !== '+' && tile !== '-') {
				tile = digits.indexOf(tile) + 1;
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

document.addEventListener('click', (e) => {
	const el = e.target;
	if (el === elmPlay) {
		newScreen(elmScreenGame);
	} else if (el === elmGroup) {
		vkBridge.send('VKWebAppJoinGroup', { 'group_id': 213140436 });
	} else if (el === elmPost) {
		const postText = elmLvl.textContent;
		vkBridge.send('VKWebAppShowWallPostBox', {
			'message': `Мой уровень в игре Game - ${postText}! Сможешь побить?\n\nOrby Games (vk.com/orby.games) - бесплатные игры для ВКонтакте. Присоединяйся!\n\n#игры #vkgames #directgames`,
			'attachments': 'https://vk.com/app8195384'
		})
	} else if (el === elmInvite) {
		vkBridge.send('VKWebAppShowInviteBox')
	} else if (el === elmHome) {
		newScreen(elmScreenStart);
	} else if (el === elmBack) {
		if (orderEl.length) {
			orderEl[orderEl.length - 1].forEach(element => {
				element.classList.remove('active', 'completed', 'top', 'left', 'right', 'bottom');
				if (element.classList.contains('start')) element.classList.add('active');
				if (!element.classList.contains('start') && !element.classList.contains('end')) {
					element.textContent = '';
				}
			});
			orderEl.splice(orderEl.length - 1, 1);
			if (!orderEl.length) {
				elmBack.classList.add('hidden');
			}
		}
	} else if (el.closest('.hint')) {
		if (userHelp !== 'null') {
			userHelp--;
			if (userHelp < 1) {
				elmHint.classList.add('show');
				userHelp = 'null';
				helpKey = userHelp;
			} else {
				helpKey = String(userHelp);
			}
			elmHint.firstElementChild = userHelp;

			vkBridge.send('VKWebAppStorageGet', { 'keys': ['helpKey1'] })
				.then(() => {
					// Записываем подсказки в ключ хранилища
					vkBridge.send('VKWebAppStorageSet', { key: 'helpKey1', value: helpKey });
				});

			for (let i = 0; i < paths[index].length; i++) {
				const element = paths[index][i];
				let hintNumber = 2;
				for (const elementNumber of element) {
					if (elmGridItems[elementNumber].classList.contains('active')) {
						break;
					} else {
						if (!elmGridItems[elementNumber].classList.contains('end')) {
							elmGridItems[elementNumber].insertAdjacentHTML('afterbegin', `<span>${hintNumber}</span>`);
						}
						hintNumber++;
						i++;
					}
				}
			}
		} else {
			// Показ рекламы + показ экрана конца игры
			vkBridge.send("VKWebAppCheckNativeAds", { "ad_format": "reward" })
				.then(() => {
					vkBridge.send("VKWebAppShowNativeAds", { "ad_format": "reward", "use_waterfall": true })
						.then(() => {
							userHelp = 3;

							vkBridge.send('VKWebAppStorageGet', { 'keys': ['helpKey1'] })
								.then(() => {
									// Записываем подсказки в ключ хранилища
									vkBridge.send('VKWebAppStorageSet', { key: 'helpKey1', value: String(userHelp) });
								})

							toggleClasses([elmHint], 'remove', ['show', 'error'], 0);
							elmHint.firstElementChild = userHelp;
						})
						.catch(() => {
							elmHint.classList.add('error');
							elmHint.firstElementChild = userHelp;
						})
				})
		}
	}
	// else if (el === elmVolume) {
	// 	volume = !volume;
	// 	elmVolume.classList.toggle('off');
	// }
	if (el.closest('button')) {
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
								if (elmGrid.querySelectorAll('.start').length > 1) {
									orderEl.push(numbersArray);
									elmBack.classList.remove('hidden');
								}
								setTimeout(() => {
									if (!lvlComplete) {
										confetti({
											particleCount: 50,
											decay: scale / 2,
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
								if (numberLock) out();
								numberLock = false;
							}
						} else {
							if (numberLock) {
								if (!numbersArray[numbersArray.length - 1].classList.contains('completed')) {
									addNumber();
									el.textContent = numbers;
								}
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
				if (!el.classList.contains('completed')) {
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
				} else {
					out();
				}
			}
			lvlEnd();
		} else {
			out();
		}
	}
}

//================================================================================

// Создание новой цифры
function addNumber() {
	vkBridge.send("VKWebAppTapticImpactOccurred", { "style": "light" });
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

function lvlEnd() {
	if (elmGrid.querySelectorAll('.active').length >= numbersAim) {
		if (!lvlComplete) {
			toggleClasses([elmHome, elmLvl, elmBack, elmHint], 'add', ['hidden']);
			if (volume) audio.Confetti.play();
			lvl++;
			setTimeout(() => {
				vkBridge.send('VKWebAppStorageGet', { 'keys': ['lvlKey1'] })
					.then(() => {
						// Записываем рекорд в ключ хранилища
						vkBridge.send('VKWebAppStorageSet', { key: 'lvlKey1', value: String(lvl) });
					});
				if (isMobile.any()) {
					document.removeEventListener('touchmove', move);
				} else {
					document.removeEventListener('mousemove', move);
				}
				toggleClasses([elmHome, elmLvl, elmHint], 'remove', ['hidden']);
				elmGrid.remove();
				createLvl(lvl);
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
		}
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
			toggleClasses([screen], 'add', ['hidden', oldScreenSide], 500);
		} else if (screen === newScreen) {
			toggleClasses([screen], 'remove', ['hidden', newScreenSide], 500);
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
