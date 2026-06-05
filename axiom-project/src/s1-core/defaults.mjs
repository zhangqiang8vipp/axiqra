export const DEFAULT_SUBJECTS = {
  ANON: {
    subjectKey: 'ANON',
    authenticated: false,
    scopes: [],
    entries: ['public_home', 'public_solution_network', 'public_case_search'],
    advancedEntries: [],
    grants: ['public'],
  },
  BASE_USER: {
    subjectKey: 'BASE_USER',
    authenticated: true,
    scopes: ['search:read', 'trace:write'],
    entries: ['home', 'personal_workspace', 'public_solution_network', 'public_case_search'],
    advancedEntries: [],
    grants: ['public', 'own'],
  },
  REVIEWER: {
    subjectKey: 'REVIEWER',
    authenticated: true,
    scopes: ['search:read', 'trace:write', 'review:write'],
    entries: ['home', 'personal_workspace', 'public_solution_network', 'public_case_search'],
    advancedEntries: ['review_queue'],
    grants: ['public', 'own', 'review_scope'],
  },
  ORG_ADMIN: {
    subjectKey: 'ORG_ADMIN',
    authenticated: true,
    scopes: ['search:read', 'trace:write', 'review:write', 'audit:read'],
    entries: ['home', 'personal_workspace', 'public_solution_network', 'public_case_search'],
    advancedEntries: ['enterprise_admin_console', 'tenant_policy', 'audit_export'],
    grants: ['public', 'own', 'enterprise'],
  },
};

export const DEFAULT_MEMORY = [
  {
    id: 'pub_case_next_oauth',
    type: 'Public Case',
    title: 'Next.js OAuth callback returns 400 after redirect',
    summary: 'Normalize callback URL and provider state before retry.',
    visibility: 'public',
    desensitized: true,
    tags: ['next.js', 'oauth', 'callback'],
  },
  {
    id: 'team_private_seed',
    type: 'Project Case',
    title: 'enterprise-private-seed-title',
    summary: 'Private enterprise seed that must never leak to anonymous search.',
    visibility: 'enterprise',
    desensitized: false,
    tags: ['private', 'enterprise'],
  },
];
