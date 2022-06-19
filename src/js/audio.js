import sndClick from '../audio/click.wav';
import sndConfetti from '../audio/confetti.wav';

export const audio = {
	Click: new Howl({
		src: './audio/click.wav',
		html5: true
	}),
	Confetti: new Howl({
		src: './audio/confetti.wav',
		html5: true
	})
}