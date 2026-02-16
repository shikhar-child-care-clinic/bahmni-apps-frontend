# Bahmni Apps Frontend Project Structure

This document provides a comprehensive overview of the Nx monorepo project structure, explaining the purpose of each main directory and how the applications and shared libraries are organized.

## Directory Structure Overview

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

## Main Directories

### `/apps`

Contains the micro-frontend applications that make up the Bahmni Apps Frontend. Each application is independently deployable and can be developed and tested separately.

#### `/apps/clinical`

The Clinical module application providing consultation and clinical workflows. This is the primary application for clinical operations.

**Key Components:**
- `src/components/` - UI components specific to clinical workflows
- `src/hooks/` - Custom hooks for clinical data management
- `src/pages/` - Page components for different clinical views
- `src/stores/` - Zustand state management stores
- `src/providers/` - Context providers for clinical state

#### `/apps/registration`

The Patient Registration module for managing patient registration workflows.

**Key Components:**
- `src/components/` - UI components for registration forms and flows
- `src/hooks/` - Custom hooks for registration logic
- `src/pages/` - Page components for registration views

#### `/apps/sample-app-module`

An example extensible application module demonstrating best practices for creating new applications within the monorepo.

### `/packages`

Contains shared libraries and utilities used across multiple applications.

#### `/packages/bahmni-design-system`

Reusable UI component library built on top of the Carbon Design System. Organized using atomic design principles:

- `atoms/` - Basic building blocks (buttons, inputs, labels)
- `molecules/` - Simple component combinations (cards, modals)
- `organisms/` - Complex component combinations (tables, forms)

#### `/packages/bahmni-services`

Provides API integration, business logic, and data transformation services:

- `api/` - HTTP client setup and interceptors
- Service modules - `patientService`, `medicationService`, `allergyService`, `observationService`
- Utilities - `i18n`, `date`, common utility functions

#### `/packages/bahmni-widgets`

Domain-specific display controls for clinical data visualization:

- `AllergiesTable/` - Component for displaying patient allergies
- `MedicationsTable/` - Component for displaying medications
- `PatientDetails/` - Component for displaying patient information

### `/distro`

The shell/distribution application that serves as the entry point. This application:

- Handles root routing and navigation
- Integrates all micro-frontend applications
- Manages the overall application layout
- Bundles for production deployment

### `/docs`

Project documentation including:

- `architecture.md` - Architecture patterns and design decisions
- `project-structure.md` - This file
- `setup-guide.md` - Setup and development environment guide
- `i18n-guide.md` - Internationalization implementation
- `sortable-data-table-guide.md` - Data table component usage
- `global-notification-guide.md` - Notification system usage

### `/docker`

Docker configuration files for containerization and deployment.

### `/helm`

Kubernetes Helm charts for orchestrating Bahmni Apps Frontend deployment.

### `/.github`

GitHub-specific configurations:

- `workflows/` - CI/CD workflows for automated testing, building, and deployment

### Root Configuration Files

- `nx.json` - Nx configuration and workspace setup
- `tsconfig.base.json` - Shared TypeScript configuration
- `eslint.config.ts` - Shared ESLint configuration
- `jest.config.ts` - Shared Jest testing configuration
- `package.json` - Root dependencies and scripts
- `README.md` - Project overview and quick start guide

## Architecture Highlights

### Monorepo Structure

The project follows the Nx monorepo pattern which provides:

- **Code sharing** - Shared libraries can be reused across applications
- **Independent deployments** - Each application can be deployed separately
- **Optimized builds** - Only affected applications and packages are rebuilt
- **Consistent tooling** - Shared ESLint, TypeScript, and Jest configurations

### Micro-Frontend Architecture

Each application in `/apps` is independently deployable and can be:

- Developed and tested in isolation
- Deployed to different environments
- Updated independently without affecting other applications

### Shared Libraries Strategy

Common functionality is extracted into `/packages`:

- UI components are centralized in `bahmni-design-system`
- Business logic and API services are centralized in `bahmni-services`
- Domain-specific components are provided by `bahmni-widgets`

This approach promotes code reuse and consistency across applications.

## Conclusion

This monorepo structure enables scalable development of multiple Bahmni applications while promoting code sharing and consistency. For more details on specific aspects of the architecture and design patterns, refer to [Architecture Documentation](./architecture.md).
