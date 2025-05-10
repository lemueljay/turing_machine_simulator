/**********************************************************************
 *  LemuelJay's Simple TuringMachine Class
 *********************************************************************/
export default class TuringMachine {

    constructor(spec, tapeStr = "") {
        this._validateSpec(spec);
        this.spec = spec;
        this.reset(tapeStr);
    }

    reset(tapeStr = "") {
        this.tape = [...tapeStr];
        this.head = 0;
        this.state = this.spec.start;
        this.halted = false;
    }

    step() {
        if (this.halted) {
            return;
        }

        const read = this._read();
        const rule = this.spec.rules?.[this.state]?.[read];

        if (!rule) {
            // no transition -> reject
            this.halted = true;
            this.state = "__reject__";
            return;
        }

        this._write(rule.write);
        this._move(rule.move);
        this.state = rule.next;
        this.halted = this.spec.accept.includes(this.state);
    }

    _read() {
        return this.tape[this.head] ?? this.spec.blank;
    }

    _write(s) {
        if (s === "_") {
             // no write ⇒ no change
             return;
        }
        this.tape[this.head] = s; 
    }

    _move(dir) {
        if (dir === "L") {
            if (this.head === 0) this.tape.unshift(this.spec.blank);
            else this.head--;
        } else if (dir === "R") {
            this.head++;
            if (this.head === this.tape.length) this.tape.push(this.spec.blank);
        }
    }

    _validateSpec(s) {
        const err = m => { throw new Error("Spec error: " + m); };
        if (!s || typeof s !== "object") err("spec must be object");
        if (typeof s.blank !== "string") err("missing blank");
        if (typeof s.start !== "string") err("missing start");
        if (!Array.isArray(s.accept)) err("accept must be array");
        if (typeof s.rules !== "object") err("rules must be object");
        for (const [st, tbl] of Object.entries(s.rules)) {
            for (const [sym, r] of Object.entries(tbl)) {
                if (!"write" in r || !"move" in r || !"next" in r) err(`bad rule ${st}/${sym}`);
            }
        }
    }
}