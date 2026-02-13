# Bahmni Apps Frontend

A React TypeScript monorepo application for Bahmni's Clinical and Registration modules, built with Nx, Webpack, and Carbon Design System. This application includes PWA support for offline capabilities.

## Features

- **TypeScript** - Type-safe JavaScript
- **React** - UI library for building user interfaces
- **Carbon Design System** - IBM's open-source design system
- **Webpack** - Module bundler for modern JavaScript applications
- **PWA Support** - Progressive Web App capabilities for offline use
- **React Router** - Declarative routing for React applications
- **i18n Support** - Internationalization for multiple languages
- **Jest & Testing Library** - Comprehensive testing framework
- **Display Controls** - Reusable clinical data visualization components

## Prerequisites

- Node.js (v18.x or later recommended)
- Yarn (v1.22.x or later recommended)

## Getting Started

### Installation

```bash
# Install dependencies
yarn
```

### Detailed Setup Guide

For a comprehensive setup guide including development environments, Docker configuration, authentication setup, and troubleshooting, please refer to our [Setup Guide](docs/setup-guide.md).

### Additional Documentation

- [Frontend Architecture](docs/architecture.md) - A comprehensive overview of the Bahmni Clinical Frontend architecture
- [Project Structure](docs/project-structure.md) - A high-level overview of the project structure
- [i18n Guide](docs/i18n-guide.md) - Internationalization implementation details
- [Sortable Data Table Guide](docs/sortable-data-table-guide.md) - Usage of the sortable data table component
- [Global Notification Guide](docs/global-notification-guide.md) - Using the notification system

### Building for Production

```bash
# Build the application
yarn nx build distro
```

The build artifacts will be stored in the `dist/` directory.

### Development

```bash
# Start the development server
yarn nx serve distro
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Linting

```bash
# Run ESLint to check for code quality issues
yarn lint

# Fix ESLint issues automatically
yarn lint:fix
```

## Project Structure

```text
bahmni-apps-frontend/
├── apps/                    # Micro-frontend applications
│   ├── clinical/            # Clinical consultation module
│   │   ├── src/             # Source code
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── pages/       # Page components
│   │   │   ├── providers/   # Context providers
│   │   │   ├── stores/      # Zustand stores
│   │   │   └── ClinicalApp.tsx
│   │   ├── public/          # Static assets
│   │   │   └── locales/     # Translation files
│   │   └── project.json     # Nx project configuration
│   ├── registration/        # Patient registration module
│   │   ├── src/             # Source code
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── pages/       # Page components
│   │   │   └── RegistrationApp.tsx
│   │   ├── public/          # Static assets
│   │   │   └── locales/     # Translation files
│   │   └── project.json     # Nx project configuration
│   └── sample-app-module/   # Example extensible app
├── packages/                # Shared libraries
│   ├── bahmni-design-system/ # Reusable UI components (Carbon-based)
│   │   ├── src/
│   │   │   ├── atoms/       # Basic UI components
│   │   │   ├── molecules/   # Composite components
│   │   │   └── organisms/   # Complex components
│   │   └── project.json
│   ├── bahmni-services/     # API integration & business logic
│   │   ├── src/
│   │   │   ├── api/         # HTTP client & interceptors
│   │   │   ├── patientService/
│   │   │   ├── medicationService/
│   │   │   ├── allergyService/
│   │   │   ├── observationService/
│   │   │   ├── i18n/        # Translation utilities
│   │   │   ├── date/        # Date utilities
│   │   │   └── utils/       # Common utilities
│   │   └── project.json
│   └── bahmni-widgets/      # Domain-specific display controls
│       ├── src/
│       │   ├── AllergiesTable/
│       │   ├── MedicationsTable/
│       │   ├── PatientDetails/
│       │   └── providers/   # Context providers
│       └── project.json
├── distro/                  # Shell application (entry point)
│   ├── src/
│   │   ├── app/             # Root routing
│   │   ├── main.tsx         # Application entry
│   │   └── index.html       # HTML template
│   ├── webpack.config.js    # Webpack configuration
│   └── project.json
├── docs/                    # Project documentation
│   ├── architecture.md
│   ├── project-structure.md
│   ├── i18n-guide.md
│   ├── sortable-data-table-guide.md
│   ├── global-notification-guide.md
│   └── setup-guide.md
├── docker/                  # Docker configuration
├── helm/                    # Kubernetes Helm charts
├── .github/                 # GitHub actions & workflows
├── nx.json                  # Nx configuration
├── tsconfig.base.json       # Shared TypeScript config
├── eslint.config.ts         # ESLint configuration
├── jest.config.ts           # Jest configuration
├── package.json             # Root dependencies
└── README.md                # Project documentation
```

For a more detailed explanation of the project architecture, see [Architecture Documentation](docs/architecture.md).

## Scripts

- `yarn start` - Start the development server
- `yarn build` - Build the application for production
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn lint` - Run ESLint to check for code quality issues
- `yarn lint:fix` - Fix ESLint issues automatically
- `yarn format` - Format code with Prettier

## Technologies

- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Carbon Design System](https://carbondesignsystem.com/) - IBM's design system
- [Webpack](https://webpack.js.org/) - Module bundler
- [React Router](https://reactrouter.com/) - Routing library
- [i18next](https://www.i18next.com/) - Internationalization framework
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React testing utilities
- [ESLint](https://eslint.org/) - Code quality tool
- [Prettier](https://prettier.io/) - Code formatter
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA tooling

## License

[Add license information here]
