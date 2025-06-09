# Contributing to Meatify 🥩

We love your input! We want to make contributing to Meatify as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 Quick Start for Contributors

### Prerequisites
- Node.js 18+ and npm
- Docker (for testing containerized deployment)
- Git

### Setting Up Your Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/meatify.git
cd meatify

# 3. Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/meatify.git

# 4. Install dependencies
npm install

# 5. Start the development server
npm run dev
```

## 🔄 Development Workflow

### We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/amazing-new-feature
   ```

4. **Open a Pull Request** against the `main` branch

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```bash
git commit -m "feat(sensors): add support for 8th temperature probe"
git commit -m "fix(mobile): resolve chart rendering issue on iOS Safari"
git commit -m "docs(readme): update deployment instructions"
```

## 🧪 Testing Your Changes

### Manual Testing
```bash
# Start development server
npm run dev

# Test Docker build
docker build -t meatify-test .
docker run -p 3000:3000 meatify-test

# Test production build
npm run build
npm start
```

### Code Quality Checks
```bash
# Lint your code
npm run lint

# Type checking
npx tsc --noEmit

# Format code (if Prettier is configured)
npm run format
```

## 📋 Pull Request Process

1. **Ensure your PR description clearly describes the problem and solution**
2. **Include the relevant issue number if applicable**
3. **Update documentation** if you're changing functionality
4. **Add screenshots** for UI changes
5. **Test your changes** thoroughly

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested locally in development mode
- [ ] Tested Docker build
- [ ] Tested on mobile devices (if applicable)
- [ ] Tested with real temperature sensor data (if applicable)

## Screenshots (if applicable)
Add screenshots to help explain your changes

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 🐛 Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/YOUR_REPO/meatify/issues/new).

**Great Bug Reports** tend to have:
- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Bug Report Template
```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 11, macOS, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Safari 15, Firefox 95]
- Node.js version: [e.g. 18.17.0]
- Meatify version: [e.g. 1.2.3]

## Additional Context
Add any other context about the problem here.
```

## 💡 Feature Requests

We love feature requests! Before submitting one, please:

1. **Check if the feature already exists** or is planned
2. **Search existing issues** to avoid duplicates
3. **Provide a clear use case** for the feature
4. **Consider the scope** - is this a core feature or could it be a plugin?

### Feature Request Template
```markdown
## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternative Solutions
A clear and concise description of any alternative solutions or features you've considered.

## Use Cases
Describe specific scenarios where this feature would be useful.

## Additional Context
Add any other context or screenshots about the feature request here.
```

## 🏗️ Architecture Guidelines

### Code Organization
- **Components**: Reusable React components in `/components`
- **Pages**: Next.js pages in `/app`
- **Utils**: Utility functions in `/lib`
- **Types**: TypeScript types in `/lib/types.ts`
- **API**: API routes in `/app/api`

### Coding Standards

#### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` types - use proper typing
- Export types for reuse across components

#### React Components
- Use functional components with hooks
- Implement proper props interfaces
- Use meaningful component and prop names
- Keep components focused and single-purpose

#### Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Use semantic class names
- Maintain consistent spacing and typography

#### Performance
- Optimize for mobile devices
- Minimize API calls and data fetching
- Use React.memo() for expensive components
- Implement proper loading states

### Sensor Data Integration
When working with temperature sensor data:
- Always validate incoming sensor data
- Handle sensor disconnection gracefully  
- Implement proper error boundaries
- Consider data persistence and session management

## 🎯 Areas We Need Help With

- **Hardware Integration**: Support for additional sensor types
- **Mobile Optimization**: iOS/Android specific improvements
- **Internationalization**: Multi-language support
- **Data Export**: CSV/JSON export functionality
- **Charts & Analytics**: Advanced temperature analysis features
- **Documentation**: User guides and API documentation
- **Testing**: Unit tests and integration tests

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

## 🙋‍♂️ Questions?

Feel free to:
- Open an issue for questions about the codebase
- Start a discussion for broader topics
- Reach out to maintainers directly

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to Meatify! Happy grilling! 🔥🥩**
