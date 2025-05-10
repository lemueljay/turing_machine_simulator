export default class DFA {
    constructor({ states, alphabet, transitions, start, finals }) {
      this.states = states; // Array of state labels
      this.alphabet = alphabet; // Array of input symbols
      this.transitions = transitions; // Object: { state: { symbol: nextState, ... }, ... }
      this.start = start; // Start state label
      this.finals = finals; // Array of final state labels
    }
  
    /**
     * Scan the SVG (#canvas) and build a DFA instance.
     * Requires each .transition-group to have data-src and data-dest attributes.
     */
    static fromDOM() {
      // Collect state elements
      const stateEls = Array.from(document.querySelectorAll('.state-group'));
      const states = stateEls.map(el => el.dataset.label);
      const startEl = document.querySelector('.state-group[data-start="true"]');
      const start = startEl ? startEl.dataset.label : null;
      const finals = stateEls
        .filter(el => el.dataset.final === 'true')
        .map(el => el.dataset.label);
  
      // Collect transitions
      const transitions = {};
      const symbolSet = new Set();
      document.querySelectorAll('.transition-group').forEach(group => {
        const labelStr = group.querySelector('text').textContent.trim();
        const src = group.dataset.src;
        const dest = group.dataset.dest;
        const syms   = labelStr.split(/\s*,\s*/);
        if (!transitions[src]) transitions[src] = {};
        syms.forEach(sym => {
            transitions[src][sym] = dest;
            symbolSet.add(sym);
        });
      });
      const alphabet = Array.from(symbolSet);
  
      return new DFA({ states, alphabet, transitions, start, finals });
    }
  
    /**
     * Validate this DFA structure:
     * - Start state and finals are in states set
     * - Transitions only mention known states and symbols
     * - Every state has exactly one transition for each symbol
     * Returns { valid: boolean, errors: string[] }
     */
    validate() {
      const errors = [];
      // Check start
      if (!this.start || !this.states.includes(this.start)) {
        errors.push(`Invalid start state: "${this.start}"`);
      }
      // Check finals
      this.finals.forEach(f => {
        if (!this.states.includes(f)) {
          errors.push(`Invalid final state: "${f}"`);
        }
      });
      // Check transition keys and values
      Object.entries(this.transitions).forEach(([state, trans]) => {
        if (!this.states.includes(state)) {
          errors.push(`Transitions defined for unknown state: "${state}"`);
        }
        Object.entries(trans).forEach(([sym, dest]) => {
          if (!this.alphabet.includes(sym)) {
            errors.push(`Symbol "${sym}" not in alphabet for state "${state}"`);
          }
          if (!this.states.includes(dest)) {
            errors.push(`Transition from "${state}" with "${sym}" goes to unknown state "${dest}"`);
          }
        });
      });
      // Ensure totality: each state has one outgoing for each symbol
      this.states.forEach(s => {
        this.alphabet.forEach(sym => {
          const has = this.transitions[s] && this.transitions[s][sym];
          if (!has) {
            errors.push(`Missing transition for state "${s}" on symbol "${sym}"`);
          }
        });
      });
      return { valid: errors.length === 0, errors };
    }
  
    /**
     * Return the raw transition table object
     */
    getTransitionTable() {
      return this.transitions;
    }
  
    /**
     * Test if input string is accepted by this DFA
     */
    accepts(input) {
      let current = this.start;
      for (const symbol of input) {
        const next = this.transitions[current]?.[symbol];
        if (!next) return false;
        current = next;
      }
      return this.finals.includes(current);
    }
  }
  