import React from 'react'
import axios from 'axios'

import API_KEY from '../private/API_KEY'
const TRAIN_URL = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/'

class Table extends React.Component {
  constructor(props) {
    super(props);

    /* initialize state (Farragut North for now) */
    this.state = {
      station: props.station,
      trains: null,
    }
  }

  componentDidMount() {
    this.update();
  }

  update() {
    this.setState({station: this.props.station});

    /* get trains from API */
    axios.get(`${TRAIN_URL + this.state.station}`, {headers: {api_key: API_KEY}})
      .then(res => {
        this.setState({
          trains: res.data.Trains
        });
      });

      let timer = setTimeout(this.update.bind(this), 1000);
      this.setState({
        timer: timer
      });
    }

    componentWillUnmount() {
      clearTimeout(this.state.timer);
    }

  render() {
    /* do not attempt to load before reading data */
    if (this.state.trains == null) {
      return (
        <div>Loading...</div>
      )
    } else {
      /* render table */
      return(
        <div className="Table-container">
          <table className="Table">
            {/* group 1 */}
            <thead className="Table-head">
              <tr>
                <th>Line</th>
                <th>Destination</th>
                <th>Arrival</th>
              </tr>
            </thead>
            <tbody className="Table-body">
              {this.state.trains.filter(train => train.Group === '1').map((train, index) =>(
                <tr key={index}>
                  <td>
                    <span className="Table-line">{train.Line}</span>
                  </td>
                  <td>
                    <span className="Table-destination">{train.DestinationName}</span>
                  </td>
                  <td>
                    <span className="Table-arrival">{train.Min}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* group 2 */}
            <thead className="Table-head">
              <tr>
                <th>Line</th>
                <th>Destination</th>
                <th>Arrival</th>
              </tr>
            </thead>
            <tbody className="Table-body">
              {this.state.trains.filter(train => train.Group === '2').map((train, index) =>(
                <tr key={index}>
                  <td>
                    <span className="Table-line">{train.Line}</span>
                  </td>
                  <td>
                    <span className="Table-destination">{train.DestinationName}</span>
                  </td>
                  <td>
                    <span className="Table-arrival">{train.Min}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }
}

export default Table;
