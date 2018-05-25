import React from 'react'
import axios from 'axios'
import _ from 'underscore'

import Stations from '../resources/stations.json'

import API_KEY from '../private/API_KEY'
const INCIDENT_URL = 'https://api.wmata.com/Incidents.svc/json/Incidents'

class Alert extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      station: null,
      colors: null,
      alerts: null,
      timer: null
    }
  }

  componentDidMount() {
    this.update();
  }

  update() {
    this.setState({
      station: this.props.station,
      colors: this.getColors(this.props.station)
    });

    /* TODO
     * axios API call
     * get alerts matching colors
     */

    if (this.state.colors != null) {
      axios.get(`${INCIDENT_URL}`, {headers: {api_key: API_KEY}})
        .then(res => {
          let incidents = res.data.Incidents;
          let alerts = _.filter(incidents.LinesAffected, function(str) {
            for (var i = 0; i < this.state.colors.length; i++) {
              if (str.includes(this.state.colors[i])) {
                console.log(this.state.colors[i])
                return true;
              }
            }
            return false;
          });

          this.setState({
            alerts: alerts
          });
        })
    }

    let timer = setTimeout(this.update.bind(this), 1000);
    this.setState({
      timer: timer
    });
  }

  componentWillUnmount() {
    clearTimeout(this.state.timer);
  }

  getColors(stationCode) {
    if (stationCode == null) {
      return null;
    }

    let station = _.findWhere(Stations.Stations, {Code: stationCode});
    let colors = [];

    if (station.LineCode1) {colors.push(station.LineCode1);}
    if (station.LineCode2) {colors.push(station.LineCode2);}
    if (station.LineCode3) {colors.push(station.LineCode3);}
    if (station.LineCode4) {colors.push(station.LineCode4);}

    return colors;
  }

  render() {
    if (this.state.alerts == null) {
      return(
        <div/>
      )
    }

    return (
      <div>
        {/* TODO */}
      </div>
    )
  }
}

export default Alert;
