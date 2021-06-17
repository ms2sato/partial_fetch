/**
 * @typedef {Object} Effect
 * @property {string} action
 * @property {string} html
 */

/**
 * @typedef {Object} Protocol
 * @property {Object.<string, Effect>} effects
 */

// export type Effect = {
//   action: string;
//   html: string;
// }

// export interface Protocol {
//   effects: Record<string, Effect>
// }

// interface Action {
//   (elm: HTMLElement, part: string): void
// }

// type ActionNames = keyof typeof actions
  
const partial = (() => {
  const contentType = 'application/partial+json'

  /**
   * text to Template Element
   * @param {string} text 
   * @returns 
   */
  function textToNode(text) {
    const template = document.createElement("template")
    template.innerHTML = text
    return template.content
  }
  
  /**
   * get URLSearchParams from form
   * @param {HTMLFormElement} form 
   * @returns 
   */
  function getURLSearchParams(form) {
    return new URLSearchParams(new FormData(form))
  }
  
  /**
   * default actions
   */
  const actions = {
    /**
     * apply innerHTML to elm
     * @param {HTMLElement} elm 
     * @param {string} part 
     */
    inner: function inner(elm, part) {
      elm.innerHTML = part
    },

    /**
     * apply appendChild to elm
     * @param {HTMLElement} elm 
     * @param {string} part 
     */
    appendChild: function appendChild(elm, part) {
      elm.appendChild(textToNode(part))
    },

    /**
     * apply prependChild to elm(NotImplemented)
     * @param {HTMLElement} _elm 
     * @param {string} _part 
     */
    prependChild: function prependChild(_elm, _part) {
      throw new Error('NotImplemented')
    },

    /**
     * apply remove to elm(NotImplemented)
     * @param {HTMLElement} _elm 
     * @param {string} _part 
     */
     remove: function remove(_elm, _part) {
      throw new Error('NotImplemented')
    },

    /**
     * apply replaceChild to elm
     * @param {HTMLElement} elm 
     * @param {string} part 
     */
    replace: function replace(elm, part) {
      elm.parentElement.replaceChild(textToNode(part), elm)
    }
  }

  /**
   * send partial request
   * @param {string} path 
   * @param {RequestInit} [options={}]
   * @returns 
   */
  async function partial(path, options = {}) {
    const res = await fetch(path, options)
  
    if (res.redirected) {
      window.location.assign(res.url)
      return
    }
  
    const resContentType = res.headers.get('Content-Type')
    if (!resContentType) {
      throw new Error("Content-Type not found")
    }
  
    if (!resContentType.includes(contentType)) {
      // nop
      console.debug(`Content-Type missmatch: ${resContentType}`)
      return
    }
  
    /**
     * @type {Protocol}
     */
    const { effects } = await res.json()

    for (const [selector, effect] of Object.entries(effects)) {
      /**
       * @type {Effect}
       */
      const { html, action } = effect
  
      const actionFunc = actions[action]
      if (!action) {
        throw new Error(`"${action}" is not found in partial.actions`)
      }
  
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`"${selector}" is not found in document`)
      }
      actionFunc(element, html)
    }
  }
  
  /**
   * partial for FormElement
   * @param {HTMLFormElement} form
   * @param {RequestInit} [options={}]
   * @returns 
   */
  async function partialForm(form, options = {}) {
    return partial(form.action, {
      method: 'post',
      body: getURLSearchParams(form),
      ...options
    })
  }
  
  /**
   * partial for FormElement on FileUploading
   * @param {HTMLFormElement} form 
   * @param {RequestInit} [options={}]
   * @returns 
   */
  async function partialFileForm(form, options = {}) {
    return partial(form.action, {
      method: 'post',
      body: new FormData(form),
      ...options
    })
  }
  
  partial.actions = actions
  partial.get = partial
  partial.form = partialForm
  partial.fileForm = partialFileForm

  // TODO: Must be able to change for customize
  return partial
})();

window.partial = partial