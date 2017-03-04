import React from 'react'
import ReactQuill from 'react-quill'
import {
  Button,
  ButtonToolbar,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup,
  Modal } from 'react-bootstrap'

export class ModalEditor extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.formatRange = this.formatRange.bind(this)
    this.onTextareaChange = this.onTextareaChange.bind(this)
    this.onEditorChange = this.onEditorChange.bind(this)
    this.onEditorChangeSelection = this.onEditorChangeSelection.bind(this)
    this.onToggle = this.onToggle.bind(this)
    this.onToggleReadOnly = this.onToggleReadOnly.bind(this)

    this.renderToolbar = this.renderToolbar.bind(this)

    this.showModal = this.showModal.bind(this)
    this.hideModal = this.hideModal.bind(this)

    this.logValue = this.logValue.bind(this)

    this.state = {
      title: '',
      showModal: false,
      theme: 'snow',
      enabled: true,
      readOnly: false,
      value: '',
      events: [],
      modules: {
        toolbar: [
          [{ 'header': [1, 2, false] }],
          ['bold', 'italic', 'underline','strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
          ['link', 'image', 'video'],
          ['clean']
        ]
      },
      formats: [
        "header",
        "bold", "italic", "underline", "strike", "blockquote",
        "list", "bullet", "indent",
        "link", "image", "video"
      ]
    }
  }

  showModal() {
    this.setState({
      showModal: true
    })
  }

  hideModal() {
    this.setState({
      showModal: false
    })
  }

  logValue() {
    this.props.handleChange(this.state.value)
    this.setState({
      showModal: false
    })
  }

  formatRange(range) {
    return range ? [range.start, range.end].join(',') : 'none'
  }

  onTextareaChange(event) {
    this.setState({
      value: event.target.value
    })
  }

  onEditorChange(value, delta, source) {
    this.setState({
      value: value,
      events: [
        'text-change(' + this.state.value + ' -> ' + value + ')'
      ].concat(this.state.events)
    })
  }

  onEditorChangeSelection(range, source) {
    this.setState({
      selection: range,
      events: [
        'selection-change(' + this.formatRange(this.state.seletion) + ' -> ' + this.formatRange(range) + ')'
      ].concat(this.state.events)
    })
  }

  onToggle() {
    this.setState({
      enabled: !this.state.enabled
    })
  }

  onToggleReadOnly() {
    this.setState({
      readOnly: !this.state.readOnly
    })
  }

  componentWillMount() {
    this.setState({
      title: this.props.title,
      value: this.props.value,
      readOnly: this.props.readOnly
    })
  }

  render() {
    return (
      <FormGroup>
        {/* <InputGroup>
          <InputGroup.Addon>
            <Glyphicon onClick={this.showModal} glyph={this.state.readOnly ? 'eye-open' : 'pencil'} />
          </InputGroup.Addon>
          <FormControl type="text" onChange={this.handleChange} />
        </InputGroup> */}
        <ButtonToolbar>
          <Button onClick={this.showModal} >
            <Glyphicon glyph={this.state.readOnly ? 'eye-open' : 'pencil'} />
          </Button>
        </ButtonToolbar>
        <Modal
          {...this.props}
          show={this.state.showModal}
          onHide={this.hideModal}
          dialogClassName='edit-modal'>
            <Modal.Header>
              {this.state.title}
            </Modal.Header>
            <Modal.Body>
              <div className='_quill'>
                <ReactQuill
                  theme='snow'
                  readOnly={this.state.readOnly}
                  modules={this.state.modules}
                  formats={this.state.formats}
                  toolbar={false}
                  bounds={'._quill'}
                  value={this.state.value}
                  onChange={this.onEditorChange}
                  onChangeSelection={this.onEditorChangeSelection}
                >
                    <div
                      key='editor'
                      ref='editor'
                      className='quill-contents border_solid_top'
                      dangerouslySetInnerHTML={{__html: this.state.value}} />
                  </ReactQuill>
                </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.hideModal}>Close</Button>
              <Button bsStyle="primary" onClick={this.logValue}>Save changes</Button>
            </Modal.Footer>
        </Modal>
      </FormGroup>

    )
  }

  renderToolbar() {
    const { state, enabled, readOnly } = this.state
    const selection = this.formatRange(this.state.selection)

    return (
      <div>
        <button
          onClick={this.onToggle}
          enabled={enabled ? true : false}
        />
        <button
          onClick={this.onToggleReadOnly}

        />
      </div>
    )
  }
}

export class QuillEditor extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.formatRange = this.formatRange.bind(this)
    this.onTextareaChange = this.onTextareaChange.bind(this)
    this.onEditorChange = this.onEditorChange.bind(this)
    this.onEditorChangeSelection = this.onEditorChangeSelection.bind(this)
    this.onToggle = this.onToggle.bind(this)
    this.onToggleReadOnly = this.onToggleReadOnly.bind(this)

    this.renderToolbar = this.renderToolbar.bind(this)

    this.state = {
      theme: 'snow',
      enabled: true,
      readOnly: false,
      value: '',
      events: []
    }
  }

  formatRange(range) {
    return range ? [range.start, range.end].join(',') : 'none'
  }

  onTextareaChange(event) {
    this.setState({
      value: event.target.value
    })
  }

  onEditorChange(value, delta, source) {
    this.setState({
      value: value,
      events: [
        'text-change(' + this.state.value + ' -> ' + value + ')'
      ].concat(this.state.events)
    })
  }

  onEditorChangeSelection(range, source) {
    this.setState({
      selection: range,
      events: [
        'selection-change(' + this.formatRange(this.state.seletion) + ' -> ' + this.formatRange(range) + ')'
      ].concat(this.state.events)
    })
  }

  onToggle() {
    this.setState({
      enabled: !this.state.enabled
    })
  }

  onToggleReadOnly() {
    this.setState({
      readOnly: !this.state.readOnly
    })
  }

  render() {
    return (
      <ReactQuill
        theme={this.state.theme}
        value={this.state.value}
        readOnly={this.state.readOnly}
        onChange={this.onEditorChange}
        onChangeSelection={this.onEditorChangeSelection}
      />
    )
  }

  renderToolbar() {
    const { state, enabled, readOnly } = this.state
    const selection = this.formatRange(this.state.selection)

    return (
      <div>
        <button
          onClick={this.onToggle}
          enabled={enabled ? true : false}
        />
        <button
          onClick={this.onToggleReadOnly}

        />
      </div>
    )
  }
}

export default QuillEditor
