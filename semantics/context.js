/*
 * Semantic Analysis Context
 *
 * A context object holds state for the semantic analysis phase.
 *
 *   const Context = require('./semantics/context');
 */

const {} = require("../ast");
const { standardFunctions } = require("./builtins");

require("./analyzer");

// When doing semantic analysis we pass around context objects.
//
// A context object holds:
//
//   1. A reference to the parent context (or null if this is the root context).
//      This allows to search for declarations from the current context outward.
//
//   2. A reference to the current function we are analyzing, if any. If we are
//      inside a function, then return expressions are legal, and we will be
//      able to type check them.
//
//   3. Whether we are in a loop (to know that a `break` is okay).
//
//   4. A map for looking up all identifiers declared in this context.

class Context {
  constructor({ parent = null, currentFunction = null, inLoop = false } = {}) {
    Object.assign(this, {
      parent,
      currentFunction,
      inLoop,
      locals: new Set(),
      functions: new Map(), //maps each function name to the num of params, or the entity itself
    });
  }

  createChildContextForFunctionBody(currentFunction) {
    // When entering a new function, we're not in a loop anymore
    return new Context({ parent: this, currentFunction, inLoop: false });
  }

  createChildContextForLoop() {
    // When entering a loop body, just set the inLoop field, retain others
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: true,
    });
  }

  createChildContextForBlock() {
    // For a block, we have to retain both the function and loop settings.
    return new Context({
      parent: this,
      currentFunction: this.currentFunction,
      inLoop: this.inLoop,
    });
  }

  // Adds a id to this context.
  add(id) {
    this.locals.add(id);
  }

  addFunction(id, func) {
    this.functions.set(id, func);
  }

  // Returns the entity bound to the given identifier, starting from this
  // context and searching "outward" through enclosing contexts if necessary.
  lookup(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.locals.has(id)) {
        return id;
      }
    }
    console.log("throwing error for undeclared id");
    throw new Error(`Identifier ${id} has not been declared`);
  }

  lookupFunction(id) {
    for (let context = this; context !== null; context = context.parent) {
      if (context.functions.has(id)) {
        return context.functions.get(id);
      }
    }
    console.log("throwing error for undeclared function");
    throw new Error(`Identifier ${id} has not been declared`);
  }
}

Context.INITIAL = new Context();
[...standardFunctions].forEach((entity) => {
  Context.INITIAL.add(entity.id);
});

module.exports = Context;
