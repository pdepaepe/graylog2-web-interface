/* global jsRoutes */

import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import EditDashboardModalTrigger from './EditDashboardModalTrigger';
import PermissionsMixin from '../../util/PermissionsMixin';

import DashboardStore from '../../stores/dashboard/DashboardStore';

const Dashboard = React.createClass({
  propTypes: {
    dashboard: React.PropTypes.object,
    permissions: React.PropTypes.arrayOf(React.PropTypes.string),
  },
  mixins: [PermissionsMixin],
  _getDashboardActions() {
    let dashboardActions;

    if (this.isPermitted(this.props.permissions, [`dashboards:edit:${this.props.dashboard.id}`])) {
      dashboardActions = (
        <div className="stream-actions">
          <DropdownButton title="More actions" pullRight>
            <MenuItem href={jsRoutes.controllers.StartpageController.set('dashboard', this.props.dashboard.id).url}>Set
              as startpage</MenuItem>
          </DropdownButton>
        </div>
      );
    } else {
      dashboardActions = (
        <div className="stream-actions">
          <DropdownButton title="More actions" pullRight>
            <MenuItem href={jsRoutes.controllers.StartpageController.set('dashboard', this.props.dashboard.id).url}>Set
              as startpage</MenuItem>
          </DropdownButton>
        </div>
      );
    }

    return dashboardActions;
  },
  render() {
    const createdFromContentPack = (this.props.dashboard.content_pack ?
      <i className="fa fa-cube" title="Created from content pack"></i> : null);

    return (
      <li className="stream">
        <h2>
          <a href={jsRoutes.controllers.DashboardsController.show(this.props.dashboard.id).url}>
            <span ref="dashboardTitle">{this.props.dashboard.title}</span>
          </a>
        </h2>

        <div className="stream-data">
          {this._getDashboardActions()}
          <div className="stream-description">
            {createdFromContentPack}
            <span ref="dashboardDescription">{this.props.dashboard.description}</span>
          </div>
        </div>
      </li>
    );
  },
  _onDashboardDelete() {
    if (window.confirm(`Do you really want to delete the dashboard ${this.props.dashboard.title}?`)) {
      DashboardStore.remove(this.props.dashboard);
    }
  },
});

export default Dashboard;
