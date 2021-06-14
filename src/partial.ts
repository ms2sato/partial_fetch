export type Effect = {
  action: string;
  html: string;
}

export interface Protocol {
  effects: Record<string, Effect>
}

export const contentType = 'application/partial+json'

function textToNode(text: string) {
  const template = document.createElement("template")
  template.innerHTML = text
  return template.content
}

function getURLSearchParams(form: HTMLFormElement) {
  return new URLSearchParams(new FormData(form) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface Action {
  (elm: HTMLElement, part: string): void
}

const actions = {
  inner: function inner(elm: HTMLElement, part: string) {
    elm.innerHTML = part
  },
  appendChild: function appendChild(elm: HTMLElement, part: string) {
    elm.appendChild(textToNode(part))
  },
  prependChild: function prependChild(_elm: HTMLElement, _part: string): void {
    throw new Error('Unimplemented');
  },
  remove: function remove(_elm: HTMLElement, _part: string): void {
    throw new Error('Unimplemented');
  },
  replace: function replace(elm: HTMLElement, part: string) {
    elm.parentElement?.replaceChild(textToNode(part), elm)
  }
}

type ActionNames = keyof typeof actions

export async function partial(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(path, options)

  if (res.redirected) {
    window.location.assign(res.url)
    return
  }

  const contentType = res.headers.get('Content-Type')
  if (!contentType) {
    throw new Error("Content-Type not found")
  }

  if (!contentType.includes(contentType)) {
    // nop
    console.debug(`Content-Type missmatch: ${contentType}`)
    return
  }

  const { effects } = await res.json() as Protocol
  for (const [selector, effect] of Object.entries(effects)) {
    const { html, action } = effect

    const actionFunc: Action = actions[action as ActionNames]
    if (!action) {
      throw new Error(`"${action}" is not found in partial.actions`)
    }

    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`"${selector}" is not found in document`)
    }
    actionFunc(element as HTMLElement, html)
  }

}

async function partialForm(
  form: HTMLFormElement,
  options: RequestInit = {}
) {
  return partial(form.action, {
    method: 'post',
    body: getURLSearchParams(form),
    ...options
  })
}

async function partialFileForm(
  form: HTMLFormElement,
  options: RequestInit = {}
) {
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
