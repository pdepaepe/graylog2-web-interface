'use strict';

var React = require('react');
var EditDashboardModal = require('./EditDashboardModal');

var EditDashboardModalTrigger = React.createClass({
    getDefaultProps() {
        return {
            action: 'create'
        };
    },
    _isCreateModal() {
        return this.props.action === 'create';
    },
    openModal() {
        this.refs['modal'].open();
    },
    render() {
        return (
            <span>
            </span>
        );
    }
});

module.exports = EditDashboardModalTrigger;
