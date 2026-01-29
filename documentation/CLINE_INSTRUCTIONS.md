# Cline AI Agent Instructions - Fantasy F1 Backend Development

## 🎯 Primary Directives

**ALWAYS INSTRUCT CLINE TO FOLLOW THESE RULES FIRST:**

1. **Read the Phase Documentation**
   - Always start by reading `documentation/DEV_SPRINTS.md` to understand current progress
   - Read `documentation/DEV_PHASES.md` to understand phase requirements
   - NEVER skip phases or jump ahead - complete each phase fully before moving to the next

2. **Mandatory CI Checks Before Any Commit**
   - Before committing ANY code changes, you MUST run all CI checks locally
   - All checks must pass with 100% success rate before pushing
   - Use the appropriate script for your OS:
     - Windows: `FantasyF1_BE/run_ci_checks.bat`
     - Linux/Mac: `FantasyF1_BE/run_ci_checks.sh`
   - If any check fails, fix it and re-run until all pass

3. **Phase Completion Criteria**
   - A phase is only considered COMPLETE when:
     - ✅ All phase requirements from DEV_PHASES.md are implemented
     - ✅ All CI checks pass locally (Black, Ruff, MyPy, pytest)
     - ✅ Code has been committed to the appropriate branch
     - ✅ Code has been pushed to the remote repository
   - Update DEV_SPRINTS.md before marking a phase complete

---

## 📋 Development Workflow

### Step 1: Assess Current State
1. Read `documentation/DEV_SPRINTS.md` - Check current phase and progress
2. Read `documentation/DEV_PHASES.md` - Review requirements for current phase
3. Verify branch name matches the phase (e.g., `dev_sprint_phase1`)

### Step 2: Implement Phase Requirements
1. Follow the detailed instructions in DEV_PHASES.md for the current phase
2. Work through each task systematically
