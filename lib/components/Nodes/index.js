var numSocket = new Rete.Socket('Number value')
var textSocket = new Rete.Socket('String')

var removeItem = function (object, key, value) {
  if (value == undefined) return
  for (var i in object) {
    if (object[i][key] == value) { object.splice(i, 1) }
  }
}

class NumControl extends Rete.Control {
  constructor (emitter, key, readonly) {
    super()
    this.emitter = emitter
    this.key = key
    this.template = '<input type="number" :readonly="readonly" :value="value" @input="change($event)"/>'

    this.scope = {
      value: 0,
      readonly,
      change: this.change.bind(this)
    }
  }

  change (e) {
    this.scope.value = +e.target.value
    this.update()
  }

  update () {
    if (this.key) { this.putData(this.key, this.scope.value) }
    this.emitter.trigger('process')
    this._alight.scan()
  }

  mounted () {
    this.scope.value = this.getData(this.key) || 0
    this.update()
  }

  setValue (val) {
    this.scope.value = val
    this._alight.scan()
  }
}

class RadioControl extends Rete.Control {
  constructor (emitter, key, value, name, text) {
    super()
    this.emitter = emitter
    this.key = key
    this.keyz = Math.random().toString(36).substr(2, 9)
    this.type = 'Radio'
    this.template = '<input id="node_radio" name={{name}} type="radio" :value="value" @click.noprevent.stop="change($event)" /><span style="display: inline-block; min-width: 160px;">{{text}}</span><button :id="id" class="node_submit" type="button" @click="del_btn($event)" />-'

    this.scope = {
      id: this.keyz,
      value: value,
      text: text,
      name: name,
      change: this.change.bind(this),
      del_btn: this.del_btn.bind(this)
    }
  }

  change (e) {
    this.scope.value = +e.target.value
    this.update()
  }

  del_btn (e) {
    var node = this.getNode()
    var id = e.target.id
    removeItem(node.controls, 'keyz', id)
    this.emitter.trigger('process')
    this.getNode()._alight.scan()
  }

  update () {
    if (this.key) { this.putData(this.key, this.scope.value) }
    this.emitter.trigger('process')
    this._alight.scan()
  }

  mounted () {
  }

  setValue (val) {
    this.scope.value = val
    this._alight.scan()
  }
}

class ButtonControl extends Rete.Control {
  constructor (emitter, key, text) {
    super()
    this.emitter = emitter
    this.key = key
    this.type = 'Button'
    this.template = '<input id="node_short_num" placeholder="Value" type="text" :value="value_num" @input="change_num($event)"/> <input id="node_short_txt" placeholder="Name" type="text" :value="value_txt" @input="change_txt($event)"/> <button class="node_submit" type="button" @click="change_btn($event)" />{{text}}'

    this.scope = {
      value_num: '',
      value_text: '',
      text: text,
      change_num: this.change_num.bind(this),
      change_txt: this.change_txt.bind(this),
      change_btn: this.change_btn.bind(this)
    }
  }

  change_btn (e) {
    if (this.scope.value_num && this.scope.value_txt != '') {
      this.getNode().addControl(new RadioControl(this.emitter, 'rad1', this.scope.value_num, 'code', this.scope.value_txt))
      this.scope.value_num = this.scope.value_txt = ''
      this.emitter.trigger('process')
      this.getNode()._alight.scan()
    }
  }

  change_num (e) {
    this.scope.value_num = e.target.value
    //        this.scope.value = e.target.value;
    this.update()
  }

  change_txt (e) {
    this.scope.value_txt = e.target.value
    this.update()
  }

  update () {
    //        if(this.key)
    //          this.putData(this.key, this.scope.value)
    this.emitter.trigger('process')
    this._alight.scan()
  }

  mounted () {
  }

  setValue (val) {
    this.scope.value = val
    this._alight.scan()
  }
}

class TextControl extends Rete.Control {
  constructor (emitter, key, readonly) {
    super()
    this.emitter = emitter
    this.key = key
    this.template = '<input type="text" :readonly="readonly" :value="value" @input="change($event)"/>'

    this.scope = {
      value: 'Input text here',
      readonly,
      change: this.change.bind(this)
    }
  }

  change (e) {
    this.scope.value = e.target.value
    this.update()
  }

  update () {
    if (this.key) { this.putData(this.key, this.scope.value) }
    this.emitter.trigger('process')
    this._alight.scan()
  }

  mounted () {
    this.scope.value = this.getData(this.key)
    this.update()
  }

  setValue (val) {
    this.scope.value = val
    this._alight.scan()
  }
}

class RadioComponent extends Rete.Component {
  constructor () {
    super('Radio')
    this.nd = {}
  }

  builder (node) {
    var out1 = new Rete.Output('Number', numSocket)
    var out2 = new Rete.Output('Text', textSocket)
    this.nd = node
      .addControl(new ButtonControl(this.editor, 'btn', '+'))
      .addControl(new RadioControl(this.editor, 'rad1', 33, 'code', 'Steel'))
      .addControl(new RadioControl(this.editor, 'rad1', 44, 'code', 'Water'))
      .addOutput(out1)
      .addOutput(out2)
    return this.nd
  }

  worker (node, inputs, outputs, sourceCode) {
    sourceCode.append(`radio_${ this.nd.id }_array = (\n`)
    for (var i in this.nd.controls) {
      if (this.nd.controls[i].type == 'Radio') {
        sourceCode.append(`"${ this.nd.controls[i].scope.text }": ${ this.nd.controls[i].scope.value },\n`)
      }
    }
    sourceCode.append(');\n')

    const key = `radio_${ node.id }_${ Math.random().toString(36).substr(2, 6) }`
    var value = 0
    if (node.data.rad1) { value = node.data.rad1 }
    sourceCode.append(`var ${ key } = ${ value };\n`)
    outputs[0] = {
      key,
      value: value
    }
  }
}

class ResultComponent extends Rete.Component {
  constructor () {
    super('Result')
  }

  builder (node) {
    var inp1 = new Rete.Input('Number', numSocket)
    var inp2 = new Rete.Input('Form String', textSocket)
    inp1.addControl(new NumControl(this.editor, 'numr'))
    inp2.addControl(new TextControl(this.editor, 'str1'))

    return node
      .addInput(inp1)
      .addInput(inp2)
      .addControl(new NumControl(this.editor, 'numr'))
  }

  worker (node, inputs, outputs, sourceCode) {
    if (inputs[0].length) { var n1 = inputs[0][0] } else {
      const key = `res_loc_num_${ Math.random().toString(36).substr(2, 6) }`
      var n1 = { key, value: node.data.numr }
      sourceCode.append(`var ${ key } = ${ n1.value };\n`)
    }

    if (inputs[1].length) { var s1 = inputs[1][0] } else {
      const key = `res_loc_str_${ Math.random().toString(36).substr(2, 6) }`
      var s1 = { key, value: node.data.str1 ? node.data.str1 : '' }
      sourceCode.append(`var ${ key } = "${ s1.value }";\n`)
    }

    this.editor.nodes.find(n => n.id == node.id).controls[0].setValue(n1.value)
    const key = `res_${ Math.random().toString(36).substr(2, 6) }`
    const value = n1.value
    sourceCode.append(`var ${ key }['value'] = ${ n1.key };\n`)
    sourceCode.append(`var ${ key }['string'] = ${ s1.key };\n`)
  }
}

var container = document.querySelector('#rete')
var components = [
  new RadioComponent(),
  new ResultComponent()
]

var editor = new Rete.NodeEditor('demo@0.1.0', container)

editor.use(AlightRenderPlugin)
editor.use(ConnectionPlugin)
editor.use(ContextMenuPlugin)

var engine = new Rete.Engine('demo@0.1.0')

components.map(c => {
  editor.register(c)
  engine.register(c)
})

editor.fromJSON({
  id: 'demo@0.1.0',
  nodes: {
    1: { id: 1, data: {}, group: null, inputs: [], outputs: [{ connections: [{ node: 2, input: 0 }] }], position: [141, 138], name: 'Radio' },
    2: { id: 2, data: { numr: 0, str1: 'Radio Buttons' }, group: null, inputs: [], outputs: [], position: [541, 138], name: 'Result' }
  },
  groups: {}
}).then(() => {
  editor.on('error', err => { alertify.error(err.message) })

  editor.on('process connectioncreate nodecreate', async function () {
    if (engine.silent) return
    const sourceCode = {
      _s: '',
      append (s) { this._s += s }
    }
    await engine.abort()
    await engine.process(editor.toJSON(), null, sourceCode)
    editor.view.resize()
    document.querySelector('#code').innerText = sourceCode._s
  })

  editor.trigger('process')
  editor.view.resize()
  console.log('process')
})
