/**
 * PostCSS Configuration
 * This file tells PostCSS which plugins to use when processing your CSS.eg:: converts tailwindcss to css
 */

module.exports = {
  plugins: {
    // Processes Tailwind CSS directives and generates utility classes
    tailwindcss: {},

    // Automatically adds vendor prefixes to CSS properties 
    // (e.g., transforms 'display: flex' to include '-webkit-box' for older browsers)
    autoprefixer: {},
  },
}