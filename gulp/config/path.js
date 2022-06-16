const buildFolder = `./dist`;
const srcFolder = `./src`;

export const path = {
	build: {
		html: `${buildFolder}/`,
		css: `${buildFolder}/css/`,
		js: `${buildFolder}/js/`,
		images: `${buildFolder}/img/`
	},
	src: {
		html: `${srcFolder}/*.html`,
		scss: `${srcFolder}/scss/style.scss`,
		js: `${srcFolder}/js/index.js`,
		images: `${srcFolder}/img/**/*.*`
	},
	watch: {
		js: `${srcFolder}/js/index.js`,
		scss: `${srcFolder}/scss/**/*.scss`,
		html: `${srcFolder}/**/*.html`,
		images: `${srcFolder}/img/**/*.*`
	},
	clean: buildFolder
}