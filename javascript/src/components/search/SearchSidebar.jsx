'use strict';

var $ = require('jquery');

var React = require('react');
var Modal = require('react-bootstrap').Modal;
var ModalTrigger = require('react-bootstrap').ModalTrigger;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Button = require('react-bootstrap').Button;
var Input = require('react-bootstrap').Input;
var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;

var Widget = require('../widgets/Widget');
var SearchStore = require('../../stores/search/SearchStore');
var SavedSearchControls = require('./SavedSearchControls');
var ShowQueryModal = require('./ShowQueryModal');
var AddToDashboardMenu = require('../dashboard/AddToDashboardMenu');

var numeral = require('numeral');

var MessageField = React.createClass({
    getInitialState() {
        return {
            showActions: false
        };
    },
    _toggleShowActions() {
        this.setState({showActions: !this.state.showActions});
    },
    render() {
        var toggleClassName = "fa fa-fw open-analyze-field ";
        toggleClassName += this.state.showActions ? "open-analyze-field-active fa-caret-down" : "fa-caret-right";

        return (
            <li>
                <div className="pull-left">
                    <i className={toggleClassName}
                       onClick={this._toggleShowActions}></i>
                </div>
                <div style={{marginLeft: 25}}>
                    <Input type="checkbox"
                           label={this.props.field.name}
                           checked={this.props.selected}
                           onChange={() => this.props.onToggled(this.props.field.name)}/>

                    {this.state.showActions &&
                    <div className="analyze-field">
                        <ButtonGroup bsSize='xsmall'>
                            <Button onClick={() => this.props.onFieldSelectedForStats(this.props.field.name)}>
                                Statistics
                            </Button>
                            <Button onClick={() => this.props.onFieldSelectedForQuickValues(this.props.field.name)}>
                                Quick values
                            </Button>
                            <Button onClick={() => this.props.onFieldSelectedForGraph(this.props.field.name)}>
                                Generate chart
                            </Button>
                        </ButtonGroup>
                    </div>}
                </div>
            </li>
        );
    }
});

var resizeMutex;

var SearchSidebar = React.createClass({
    getInitialState() {
        return {
            fieldFilter: "",
            maxFieldsHeight: 1000
        };
    },

    componentDidMount() {
        this._updateHeight();
        $(window).on('resize', this._resizeCallback);
        var $sidebarAffix = $('#sidebar-affix');
        $sidebarAffix.on('affixed.bs.affix', () => {
            $(window).off('scroll', this._updateHeight);
            this._updateHeight();
        });
        $sidebarAffix.on('affixed-top.bs.affix', () => {
            $(window).on('scroll', this._updateHeight);
            this._updateHeight();
        });
    },
    componentWillUnmount() {
        $(window).off("resize", this._resizeCallback);
        var $sidebarAffix = $('#sidebar-affix');
        $sidebarAffix.off('affixed.bs.affix');
        $sidebarAffix.off('affixed-top.bs.affix');
    },
    componentWillReceiveProps(newProps) {
        // update max-height of fields when we toggle per page/all fields
        if (this.props.showAllFields !== newProps.showAllFields) {
            this._updateHeight();
        }
    },
    _resizeCallback() {
        // Call resizedWindow() only at end of resize event so we do not trigger all the time while resizing.
        clearTimeout(resizeMutex);
        resizeMutex = setTimeout(() => this._updateHeight(), 100);
    },
    _updateHeight() {
        var header = React.findDOMNode(this.refs.header);

        var footer = React.findDOMNode(this.refs.footer);

        var sidebar = React.findDOMNode(this.refs.sidebar);
        var sidebarTop = sidebar.getBoundingClientRect().top;
        var sidebarCss = window.getComputedStyle(React.findDOMNode(this.refs.sidebar));
        var sidebarPaddingTop = parseFloat(sidebarCss.getPropertyValue('padding-top'));
        var sidebarPaddingBottom = parseFloat(sidebarCss.getPropertyValue('padding-bottom'));

        var viewPortHeight = window.innerHeight;
        var maxHeight =
            viewPortHeight -
            header.clientHeight - footer.clientHeight -
            sidebarTop - sidebarPaddingTop - sidebarPaddingBottom -
            35; // for good measure™

        this.setState({maxFieldsHeight: maxHeight});
    },

    _updateFieldSelection(setName) {
        this.props.predefinedFieldSelection(setName);
    },
    _showAllFields(event) {
        event.preventDefault();
        if (!this.props.showAllFields) {
            this.props.togglePageFields();
        }
    },
    _showPageFields(event) {
        event.preventDefault();
        if (this.props.showAllFields) {
            this.props.togglePageFields();
        }
    },
    render() {
        var indicesModal =
            <Modal title='Used Indices' onRequestHide={() => {}}>
                <div className="modal-body">
                    <p>Graylog is intelligently selecting the indices it needs to search upon based on the time frame
                        you selected.
                        This list of indices is mainly useful for debugging purposes.</p>
                    <h4>Indices used for this search:</h4>

                    <ul className="index-list">
                        {this.props.result['used_indices'].map((index) => <li key={index.index_name}> {index.index_name}</li>)}
                    </ul>
                </div>
            </Modal>;

        var messageFields = this.props.fields
            .filter((field) => field.name.indexOf(this.state.fieldFilter) !== -1)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((field) => {
                return (
                    <MessageField key={field.name}
                                  field={field}
                                  onToggled={this.props.onFieldToggled}
                                  onFieldSelectedForGraph={this.props.onFieldSelectedForGraph}
                                  onFieldSelectedForQuickValues={this.props.onFieldSelectedForQuickValues}
                                  onFieldSelectedForStats={this.props.onFieldSelectedForStats}
                                  selected={this.props.selectedFields.contains(field.name)}/>
                );
            });
        var searchTitle = null;
        var moreActions = [
        ];
        if (this.props.searchInStream) {
            searchTitle = <span>{this.props.searchInStream.title}</span>;
            // TODO: add stream actions to dropdown
        } else {
            searchTitle = <span>Search result</span>;
        }

        // always add the debug query link as last elem
        moreActions.push(<MenuItem divider key="div2"/>);
        moreActions.push(<ModalTrigger key="debugQuery" modal={<ShowQueryModal builtQuery={this.props.builtQuery} />}>
            <MenuItem>Show query</MenuItem>
        </ModalTrigger>);

        return (
            <div className="content-col" ref='sidebar'>
                <div ref='header'>
                    <h2>
                        {searchTitle}
                    </h2>

                    <p style={{marginTop: 3}}>
                        Found <strong>{numeral(this.props.result['total_result_count']).format("0,0")} messages</strong>&nbsp;
                        in {numeral(this.props.result['took_ms']).format("0,0")} ms, searched in&nbsp;
                        <ModalTrigger modal={indicesModal}>
                            <a href="#" onClick={event => event.preventDefault()}>
                                {this.props.result['used_indices'].length}&nbsp;{this.props.result['used_indices'].length === 1 ? "index" : "indices"}
                            </a>
                        </ModalTrigger>.
                    </p>

                    <div className="actions">
                        <AddToDashboardMenu title="Add count to dashboard"
                                            widgetType={this.props.searchInStream ? Widget.Type.STREAM_SEARCH_RESULT_COUNT : Widget.Type.SEARCH_RESULT_COUNT}
                                            permissions={this.props.permissions}/>

                        <SavedSearchControls currentSavedSearch={this.props.currentSavedSearch}/>

                        <div style={{display: 'inline-block'}}>
                            <DropdownButton bsSize="small" title="More actions">
                                {moreActions}
                            </DropdownButton>
                        </div>
                    </div>

                    <hr />


                    <h3>Fields</h3>

                    <div className="input-group input-group-sm" style={{marginTop: 5, marginBottom: 5}}>
                        <span className="input-group-btn">
                            <button type="button" className="btn btn-default"
                                    onClick={() => this._updateFieldSelection('default')}>Default
                            </button>
                            <button type="button" className="btn btn-default"
                                    onClick={() => this._updateFieldSelection('all')}>All
                            </button>
                            <button type="button" className="btn btn-default"
                                    onClick={() => this._updateFieldSelection('none')}>None
                            </button>
                        </span>
                        <input type="text" className="form-control" placeholder="Filter fields"
                               onChange={(event) => this.setState({fieldFilter: event.target.value})}
                               value={this.state.fieldFilter}/>
                    </div>
                </div>
                <div ref='fields' style={{maxHeight: this.state.maxFieldsHeight, overflowY: 'scroll'}}>
                    <ul className="search-result-fields">
                        {messageFields}
                    </ul>
                </div>
                <div ref='footer'>
                    <p style={{marginTop: 13, marginBottom: 0}}>
                        { this.props.showHighlightToggle &&
                        <Input type="checkbox" bsSize="small" checked={this.props.shouldHighlight}
                               onChange={this.props.toggleShouldHighlight} label="Highlight results"
                               groupClassName="result-highlight-control"/>
                        }
                    </p>
                </div>
            </div>
        );
    }
});

module.exports = SearchSidebar;
