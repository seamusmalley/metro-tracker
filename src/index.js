import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'

import Header from './components/Header'
import Table from './components/Table'
import Map from './components/Map'

import Stations from './resources/stations.json'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      stationList: null,
      output: [],
      outputStation: null,
      selection: null,
    };

  }

  getStationList() {
    let stationsWithNames = Stations.Stations.map(station => {
      return ({name: station.Name, code: station.Code})
    });

    // var API_URL = 'https://api.wmata.com/Rail.svc/json/jStations';
    //
    // axios.get(`${API_URL}`, {headers: {api_key: API_KEY}})
    //   .then(res => {
    //     var stations = res.data.Stations
    //     var stationsWithNames = stations.map(station => {
    //       return ({name: station.Name, code: station.Code})
    //     });

    stationsWithNames = _.sortBy(stationsWithNames, 'name')
    //console.log(stationsWithNames);
    this.setState({
      loading: false,
      stationList: stationsWithNames,
      selection: stationsWithNames[0].code,
      output: [stationsWithNames[0].code],
      outputStation: stationsWithNames[0].name
    });
  }

  convertStationList(list) {
    let noDuplicates = [];

    list.forEach((station) => {
      let search = _.findWhere(noDuplicates, {name: station.name});
      if (search == null) {
        noDuplicates.push(station);
      }
    });

    var stationOutput = noDuplicates.map((station) => {
      return (
        <option value={station.code} key ={station.code}>
          {station.name}
        </option>
      );
    });

    return stationOutput;
  }

  handleGoButton() {
    let stationName = _.findWhere(this.state.stationList, {code: this.state.selection}).name;
    let stationCount = _.countBy(this.state.stationList, (station) => station.name === stationName).true; //Counts how many instances of the station name appear

    if (stationCount > 1) {
      let allDuplicateStations = _.where(this.state.stationList, {name: stationName});
      let codes = allDuplicateStations.map((station) => {return station.code});
      this.setState({
        output: codes,
        outputStation: stationName
      });
    }

    else {
      this.setState({
        output: [this.state.selection], //Lock in value of selection to
        outputStation: stationName
      });
    }
  }

  handleSelectionChange(event) {
    this.setState({
      selection: event.target.value,
    });
  }

  componentDidMount() {
    this.getStationList();
    // this.setState({
    //   selection: this.state.stationList[0].code,
    //   output: this.state.selection,
    //   outputStation: this.state.stationList[0].name
    // });
  }

  render() {
    if (this.state.loading) {
      return (
        <div>
          <Header />
          <h3>Loading...</h3>
        </div>
      );
    }

    return (
        <div>
          <Header />
          <select
            defaultValue={this.state.sel}
            onChange={(event) => this.handleSelectionChange(event)}>
            { this.convertStationList(this.state.stationList) }
          </select>
          <button onClick={() => this.handleGoButton()}>Go</button>
          <h3>{this.state.outputStation}</h3>
            {this.state.output.map((output) => (
              <div key={output}>
                <Table station={output}/>
                <Map station={output}/>
              </div>
            ))}
        </div>

    );
  }

}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);
