# Consistency Check Command

## Usage
Use this command to verify consistency across all planning documents.

## Command

```
You are a Senior Full-Stack Developer. Your task is to analyze the attached files and verify whether the information they contain is consistent and not mutually exclusive.

<prd>
@prd.md
</prd>

<db-plan>
@db-plan.md
</db-plan>

<api-plan>
@api-plan.md
</api-plan>

<ui-plan>
@ui-plan.md
</ui-plan>

Verify all of those provided files and list for me specific issues with recommended fix.

Before any file modifications, ask me if you should proceed.
```

## Instructions

1. Run this command when you have made significant changes to any planning document
2. Attach all four planning documents using @ mentions:
   - @prd.md
   - @db-plan.md
   - @api-plan.md
   - @ui-plan.md
3. The AI will analyze all documents and identify inconsistencies
4. Review the issues and recommended fixes
5. Approve fixes one by one for better control
6. After completion, create a new consistency check status file with current date

## Expected Output

The AI will provide:
- A list of issues with severity levels (CRITICAL, MODERATE, MINOR)
- Recommended fixes for each issue
- Step-by-step confirmation for each fix
- A final summary with verification matrix
- Quality assessment scores

## Files to Monitor

- `.ai/prd.md` - Product Requirements Document
- `.ai/db-plan.md` - Database Schema Plan
- `.ai/api-plan.md` - REST API Specification
- `.ai/ui-plan.md` - UI Architecture Plan

## Status Files

After each consistency check session, create a status file:
- `.ai/consistency-check-status-YYYY-MM-DD.md`

This helps track the history of consistency checks and resolutions.

## Best Practices

1. **Run regularly**: Check consistency after major document updates
2. **Review thoroughly**: Don't auto-approve all fixes, review each one
3. **Keep status files**: Maintain history of consistency checks
4. **Update this command**: If the project structure changes, update this command file

## Common Issues to Watch For

### High Priority
- Contradictory feature specifications across documents
- Misaligned MVP vs Post-MVP scope
- Missing API endpoints for PRD features
- Database schema not supporting API/PRD requirements

### Medium Priority
- UX flow inconsistencies
- Missing UI components for features
- Incomplete error handling specifications
- Redirect/navigation conflicts

### Low Priority
- Terminology inconsistencies
- Minor wording differences
- Formatting inconsistencies
- Documentation gaps

## Success Criteria

A successful consistency check results in:
- ✅ All features traceable from PRD → DB/API/UI
- ✅ No contradictory specifications
- ✅ All API endpoints mapped to database operations
- ✅ All UI views supported by API endpoints
- ✅ Clear MVP scope across all documents
- ✅ Aligned technical architecture

## Post-Check Actions

After fixing inconsistencies:
1. Create a dated status file