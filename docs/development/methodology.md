# 🛠️ Iris Development Methodology

> How Iris approaches software development projects

## Core Principles

### 1. Memory-Driven Development
- Load context via `/iris` slash command at session start
- Maintain long-term memory across sessions
- Reference past decisions and learnings

### 2. Iterative Problem Solving
- Break complex problems into manageable steps
- Test incrementally
- Document solutions for future reference

### 3. Comprehensive Documentation
- Write docs as you build
- Explain decisions and trade-offs
- Create guides for users and developers

## Development Workflow

### Phase 1: Research & Planning
1. **Understand Requirements**
   - Clarify user needs
   - Research existing solutions
   - Define scope

2. **Technical Design**
   - Choose appropriate architecture
   - Select technologies and tools
   - Plan file structure

3. **Document Plan**
   - Create TODO list
   - Outline implementation steps
   - Set success criteria

### Phase 2: Implementation
1. **Build Core Features**
   - Start with MVP (Minimum Viable Product)
   - Test each component
   - Iterate based on feedback

2. **Problem Solving**
   - Debug systematically
   - Document issues and solutions
   - Learn from mistakes

3. **Integration**
   - Connect components
   - End-to-end testing
   - Performance optimization

### Phase 3: Documentation & Release
1. **User Documentation**
   - Installation guides
   - Usage instructions
   - Troubleshooting tips

2. **Developer Documentation**
   - Code architecture
   - API references
   - Contributing guidelines

3. **Version Control**
   - Git commits with clear messages
   - Semantic versioning
   - Changelog maintenance

4. **Release Process**
   - Create GitHub releases
   - Add topics/tags
   - Plan future development

## Case Study: Iris Immersive Translate

### Timeline: 2025-11-01 (6 hours)

**Phase 1: Research (1 hour)**
- Researched immersive translation concept
- Explored Ollama local LLM integration
- Decided on Chrome Extension approach

**Phase 2: Implementation (4 hours)**
- Built Manifest V3 Chrome Extension
- Integrated Ollama API
- Solved CORS issues with LaunchAgent
- Created bilingual UI with CSS

**Phase 3: Documentation (1 hour)**
- Wrote comprehensive README
- Created installation guides
- Set up version management
- Published to GitHub

### Key Learnings
1. **CORS Configuration** - Chrome extensions need explicit OLLAMA_ORIGINS setup
2. **Hotkey Conflicts** - Check for platform conflicts (BrowserOS)
3. **Model Flexibility** - Support all Ollama models, not just one
4. **Documentation First** - Good docs = easier adoption

## Tools & Technologies

### Development Tools
- **Claude Code** - Primary development environment
- **Git** - Version control
- **GitHub** - Code hosting and collaboration

### Integration Tools
- **MCP (Model Context Protocol)** - API integrations
- **BrowserOS** - Browser automation testing
- **Node.js** - Scripting and automation

### Documentation Tools
- **Markdown** - All documentation
- **GitHub Pages** - (Future) Documentation hosting

## Best Practices

### Code Quality
- Write clear, commented code
- Follow consistent style
- Test edge cases

### User Experience
- Clear error messages
- Intuitive interfaces
- Comprehensive help docs

### Maintenance
- Version management (CHANGELOG.md)
- Issue tracking
- Regular updates

## Future Improvements

- [ ] Add automated testing
- [ ] Implement CI/CD pipelines
- [ ] Create development templates
- [ ] Build example projects

---

**Last Updated:** 2025-11-01
**Maintained by:** Iris (Melchior)
