import React from 'react'
import TextEditor from './TextEditor'
import {
  Button,
  ButtonToolbar,
  FormControl,
  FormGroup,
  Glyphicon,
  InputGroup,
  Modal
} from 'react-bootstrap'

export default class ModalEditor extends React.Component {
  constructor(props) {
    super(props)

    this.showModal = this.showModal.bind(this)
    this.hideModal = this.hideModal.bind(this)
    this.logValue = this.logValue.bind(this)

    this.state = {
      showModal: false
      title: '',
      value: '',
    }
  }

  showModal() {
    this.setState({ showModal: true })
  }

  hideModal() {
    this.setState({ showModal: false })
  }

  logValue() {
    this.props.handleChange(this.state.value)
    this.setState({ showModal: false })
  }

  componentWillMount() {
    this.setState({
      title: this.props.title,
      value: this.props.value
    })
  }

  render() {
    return (
      <div>
        <Button onClick={this.showModal} style={{ margin: '0px' }}>
          <Glyphicon glyph={this.props.readOnly ? 'eye-open' : 'pencil'} />
        </Button>
        <Modal
          {...this.props}
          show={this.state.showModal}
          onHide={this.hideModal}
          dialogClassName='edit-modal'>
            <Modal.Header>
              {this.state.title}
            </Modal.Header>
            <Modal.Body>
              <TextEditor
                readOnly={this.props.readOnly}
                value={this.state.value}
                handleChange={this.onEditorChange}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.hideModal}>Close</Button>
              <Button bsStyle="primary" onClick={this.logValue}>Save changes</Button>
            </Modal.Footer>
        </Modal>
    </div>
    )
  }
}
