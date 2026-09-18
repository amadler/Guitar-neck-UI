/**
 * Action tag model — represents a clickable action embedded in chat text.
 *
 * Format: [[action:<name>;<key>=<value>;...|<label>]]
 *
 * Examples:
 *   [[action:show-pattern;type=chord;root=A;name=major|1 3 5]]
 *   [[action:show-interval;root=A;interval=b3|b3]]
 */

export interface ActionTag {
  /** Maps to DomainCommand.type — only supported values */
  action: 'show-pattern' | 'show-interval';
  /** Key-value parameters parsed from the tag */
  params: Record<string, string>;
  /** Visible label text */
  label: string;
}

export interface TextSegment {
  type: 'text';
  text: string;
}

export interface ActionSegment {
  type: 'action';
  action: ActionTag;
}

export type Segment = TextSegment | ActionSegment;

const ACTION_TAG_REGEX = /\[\[action:([a-z-]+);([^\]]+)\|([^\]]+)\]\]/g;

/**
 * Parse a chat text string into an array of segments.
 * Text outside tags becomes TextSegment, each [[action:...|...]] becomes ActionSegment.
 */
export function parseActionTags(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ACTION_TAG_REGEX.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    const action = match[1] as ActionTag['action'];
    const paramsStr = match[2];
    const label = match[3];

    // Parse semicolon-separated key=value pairs
    const params: Record<string, string> = {};
    for (const pair of paramsStr.split(';')) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        params[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }
    }

    segments.push({ type: 'action', action: { action, params, label } });
    lastIndex = match.index + match[0].length;
  }

  // Push remaining text after the last match
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  // If no segments were created at all, return the whole text as one segment
  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: 'text', text });
  }

  return segments;
}

/**
 * Validate that an action tag has all required parameters for its action type.
 */
export function isValidAction(action: ActionTag): boolean {
  if (action.action === 'show-pattern') {
    return !!(action.params['type'] && action.params['root'] && action.params['name']);
  }
  if (action.action === 'show-interval') {
    return !!(action.params['root'] && action.params['interval']);
  }
  return false;
}