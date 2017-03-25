import React from 'react'
import ReactQuill from 'react-quill'

export default class TextEditor extends React.Component {
  constructor(props) {
    super(props)
    this.formatRange = this.formatRange.bind(this)
    this.onEditorChange = this.onEditorChange.bind(this)
    this.onEditorChangeSelection = this.onEditorChangeSelection.bind(this)

    this.state = {
      value: '',
      events: []
    }

    this._modules = {
      toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline','strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image', 'video'],
        ['clean']
      ]
    }

    this._formats = [
      "header",
      "bold", "italic", "underline", "strike", "blockquote",
      "list", "bullet", "indent",
      "link", "image", "video"
    ]
  }

  formatRange(range) {
    return range ? [range.start, range.end].join(',') : 'none'
  }

  onEditorChange(value, delta, source) {
    this.setState({
      value: value,
      events: [
        'text-change(' + this.state.value + ' -> ' + value + ')'
      ].concat(this.state.events)
    })
    this.props.handleChange(value)
  }

  onEditorChangeSelection(range, source) {
    this.setState({
      selection: range,
      events: [
        'selection-change(' + this.formatRange(this.state.seletion) + ' -> ' + this.formatRange(range) + ')'
      ].concat(this.state.events)
    })
  }

  componentWillMount() {
    this.setState({ value: this.props.value })
  }

  render() {
    return (
      <div className='_quill'>
        <ReactQuill
          theme='snow'
          readOnly={this.props.readOnly}
          modules={this._modules}
          formats={this._formats}
          bounds={'._quill'}
          value={this.state.value}
          onChange={this.onEditorChange}
          onChangeSelection={this.onEditorChangeSelection}
        >
          <div
            key='editor'
            ref='editor'
            className='quill-contents border_solid_top'
            dangerouslySetInnerHTML={{__html: this.state.value}}
          />
        </ReactQuill>
      </div>
    )
  }
}
