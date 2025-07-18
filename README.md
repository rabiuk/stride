# React + Vite

A modern frontend starter template using React and Vite, featuring fast refresh, minimal configuration, and extensible ESLint rules.

## Features
- ⚡️ Fast development with Vite
- ⚛️ React with HMR (Hot Module Replacement)
- 🛠️ Minimal, extensible ESLint setup
- 📦 Easy build and deployment

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
```bash
# Clone the repository
$ git clone <your-repo-url>
$ cd <project-directory>

# Install dependencies
$ npm install
# or
yarn install
```

### Running the Development Server
```bash
$ npm run dev
# or
yarn dev
```
Visit [http://localhost:5173](http://localhost:5173) to view the app.

## Development
- Edit source files in the `src/` directory.
- Supports JSX/TSX, CSS Modules, and more.
- HMR enabled for instant feedback.

## Build
To create a production build:
```bash
$ npm run build
# or
yarn build
```
The output will be in the `dist/` folder.

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License
[MIT](LICENSE)

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
