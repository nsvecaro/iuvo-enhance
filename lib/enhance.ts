// FR4 (doc): hardcoded enhancement parameters for the panel.
export interface EnhanceParams {
  depth: 'brief' | 'standard' | 'detailed';
  simplification: 'as-is' | 'simplify' | 'eli5';
  tone: 'neutral' | 'casual' | 'formal' | 'technical';
  length: 'short' | 'medium' | 'long';
  format: 'prose' | 'bulleted' | 'step-by-step';
}
