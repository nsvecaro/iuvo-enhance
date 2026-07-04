// FR4 (doc): minimum hardcoded enhancement parameters for the panel.
// No provider exists yet (build order step 3), so nothing reads these
// beyond logging them — see Widget.svelte's onEnhance stub.
export interface EnhanceParams {
  depth: 'brief' | 'standard' | 'detailed';
  simplification: 'as-is' | 'simplify' | 'eli5';
  tone: 'neutral' | 'casual' | 'formal' | 'technical';
  length: 'short' | 'medium' | 'long';
  format: 'prose' | 'bulleted' | 'step-by-step';
}
