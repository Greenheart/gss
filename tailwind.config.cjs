const defaultTheme = require('tailwindcss/defaultTheme')

const config = {
    content: ['./index.html', './src/**/*.{js,svelte,ts}'],
    theme: {
        screens: {
            xs: '475px',
            ...defaultTheme.screens,
        },
        extend: {},
    },
}

module.exports = config
