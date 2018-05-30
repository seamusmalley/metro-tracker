import React from 'react';
import {AppRegistry, NativeModules, StyleSheet, Text, View, ScrollView, WebView, Picker} from 'react-native';
import _ from 'underscore';
import Button from 'react-native-button';

import axios from 'axios';
import Svg,{
    Circle,
    Ellipse,
    G,
    LinearGradient,
    RadialGradient,
    Line,
    Path,
    Polygon,
    Polyline,
    Rect,
    Symbol,
    Use,
    Defs,
    Stop
} from 'react-native-svg';

import { Table, TableWrapper, Row, Rows, Col } from 'react-native-table-component';

import API_KEY from './private/API_KEY'
const TRAIN_URL = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/'
const TRAIN_POS_URL = 'https://api.wmata.com/TrainPositions/TrainPositions?contentType={contentType}'

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
    let stationList = require('./resources/stations.json');

    let stationsWithNames = stationList.Stations.map(station => {
      return ({name: station.Name, code: station.Code})
    });

    stationsWithNames = _.sortBy(stationsWithNames, 'name');

    return stationsWithNames;
  }

  convertStationList(list) {
    let noDuplicates = [];

    list.forEach((station) => {
      let search = _.findWhere(noDuplicates, {name: station.name});
      if (search == null) {
        noDuplicates.push(station);
      }
    });

    var stationOutput = noDuplicates.map((station, index) => {
      return (
        <Picker.Item key={index} label={station.name} value={station.code} />
      );
    });

    return stationOutput;
  }

  componentDidMount() {
    let stations = this.getStationList();
    this.setState({
      loading: false,
      selection: stations[0].code,
      output: [stations[0].code],
      outputStation: stations[0].name
    });
  }

  handleGoButton() {
    let stations = this.getStationList();
    let stationName = _.findWhere(stations, {code: this.state.selection}).name;
    let stationCount = _.countBy(this.getStationList(), (station) => station.name === stationName).true; //Counts how many instances of the station name appear

    if (stationCount > 1) {
      let allDuplicateStations = _.where(this.getStationList(), {name: stationName});
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

  render() {

    return (
      <View style={StyleSheet.absoluteFill}>
      <Picker selectedValue={this.state.selection}
        onValueChange={(itemValue) => this.setState({selection: itemValue})} >
          { this.convertStationList(this.getStationList()) }
      </Picker>
      <Button
        onPress= {() => this.handleGoButton()}>Go</Button>
      <Text style={styles.stationTitle}>{this.state.outputStation}</Text>

      <ScrollView>
        {this.state.output.map((output, index) => (
          <View key={index}>
            <TrainTable station={output} />
            <Map station={output} />
          </View>

        ))}
      </ScrollView>
      </View>

    )
  }
}

class TrainTable extends React.Component {
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
    let tableRowTitles = ['Line', 'Destination', 'Arrival'];

    /* do not attempt to load before reading data */
    if (this.state.trains == null) {
      return (
        <Text>Loading...</Text>
      )
    } else {

      let groupOne = this.state.trains.filter(train => train.Group === '1').map((train) => {
        return [train.Line, train.DestinationName, train.Min]
      });

      let groupTwo = this.state.trains.filter(train => train.Group === '2').map((train) => {
        return [train.Line, train.DestinationName, train.Min]
      });

      return(
        <View>
          <Table borderStyle={{borderWidth: 2, borderColor: '#00316d'}}>
            <Row data={tableRowTitles} style={styles.head} textStyle={styles.text}/>
            <Rows data={groupOne} textStyle={styles.text}/>
          </Table>

          <Table borderStyle={{borderWidth: 2, borderColor: '#00316d'}}>
            <Row data={tableRowTitles} style={styles.head} textStyle={styles.text}/>
            <Rows data={groupTwo} textStyle={styles.text}/>
          </Table>
        </View>
      )
    }
  }
}

class Map extends React.Component {
  constructor(props) {
    super(props);

    let selectedStation = null;


    if (props.station.length == 0) {
      stations = this.getStationList();
      selectedStation = stations[0].code;
    }

    else {
      selectedStation = props.station;
    }

    let prevStation = selectedStation;
    let currStation = selectedStation;
    let nextStation = selectedStation;

    let neighbors = this.getNeighborStationCodes(selectedStation);

    if (neighbors[0] != null) {
      prevStation = neighbors[0];
    }

    if (neighbors[1] != null) {
      nextStation = neighbors[1];
    }

    this.state = {
      prevStation: prevStation,
      currStation: currStation,
      nextStation: nextStation,
      trains: [],
      trainPos: []
    };
  }

  componentDidMount() {
    this.update();
  }

  getStationList() {
    let stationList = require('./resources/stations.json');

    let stationsWithNames = stationList.Stations.map(station => {
      return ({name: station.Name, code: station.Code})
    });

    stationsWithNames = _.sortBy(stationsWithNames, 'name');

    return stationsWithNames;
  }

  convertColorCode(code) {
    if (code === "BL") {
      return "blue";
    }

    else if (code === "SV") {
      return "silver";
    }

    else if (code === "RD") {
      return "red";
    }

    else if (code === "OR") {
      return "orange";
    }

    else if (code === "YL") {
      return "yellow";
    }

    else if (code === "GR") {
      return "green";
     }

    else {
      return "transparent";
    }
  }

  convertColorToTrackIndex(color, trackNum) {
    if (trackNum === 1) {
      if (color === "BL") {
        return 0;
      }

      else if (color === "GR") {
        return 1;
      }

      else if (color === "OR") {
        return 2;
      }

      else if (color === "RD") {
        return 3;
      }

      else if (color === "SV") {
        return 4;
      }

      else if (color === "YL") {
        return 5;
      }

      else {
        return -1;
      }
    }

    else {
      if (color === "BL") {
        return 7
      }

      else if (color === "GR") {
        return 8;
      }

      else if (color === "OR") {
        return 9;
      }

      else if (color === "RD") {
        return 10;
      }

      else if (color === "SV") {
        return 11;
      }

      else if (color === "YL") {
        return 12;
      }

      else {
        return -1;
      }
    }
  }

  getStationColors(code) {
    let Stations = require('./resources/stations.json');

    let station = _.findWhere(Stations.Stations, {Code: code});

    let colors = [];

    if (station.LineCode1 != null) {
      colors.push(station.LineCode1);
    }

    if (station.LineCode2 != null) {
      colors.push(station.LineCode2);
    }

    if (station.LineCode3 != null) {
      colors.push(station.LineCode3);
    }

    if (station.LineCode4 != null) {
      colors.push(station.LineCode4);
    }

    return colors;
  }

  getAllStationColors() {
    let prevColors = this.getStationColors(this.state.prevStation);
    let currColors = this.getStationColors(this.state.currStation);
    let nextColors = this.getStationColors(this.state.nextStation);

    let retArray = _.intersection(prevColors, currColors, nextColors);
    return retArray;
  }

  getStationCircuitId(code, direction, lineIndex) {
    const Routes = require('./resources/routes.json');

    let station = null;

    if (direction === 1) {
      station = _.findWhere(Routes.StandardRoutes[lineIndex].TrackCircuits, {StationCode: code});
    }

    else {
      station = _.findWhere(Routes.StandardRoutes[lineIndex].TrackCircuits, {StationCode: code});
    }

    return station.CircuitId;
  }

  getSequenceNumber(lineIndex, circuitId) {
    const Routes = require('./resources/routes.json');

    let seq = _.findWhere(Routes.StandardRoutes[lineIndex].TrackCircuits, {CircuitId: circuitId});

    if (seq == null) {
      return null;
    }

    return seq.SeqNum;
  }

  getNeighborStationCodes(code) {
    const Routes = require('./resources/routes.json');
    let stationColors = this.getStationColors(code);
    let colorIndex = this.convertColorToTrackIndex(stationColors[0], 1);

    let reducedStationList = _.filter(Routes.StandardRoutes[colorIndex].TrackCircuits, (circuit) => {
      if (circuit.StationCode == null) {
        return false;
      }

      return true;
    });

    let station = _.findWhere(reducedStationList, {StationCode: code});
    let stationIndex = reducedStationList.indexOf(station);
    let neighbors = [];

    if (stationIndex === 0) {
      neighbors.push(null);
    }

    else {
      neighbors.push(reducedStationList[stationIndex-1].StationCode);
    }

    if (stationIndex === reducedStationList.length-1) {
      neighbors.push(null);
    }

    else {
      neighbors.push(reducedStationList[stationIndex+1].StationCode);
    }

    return neighbors;
  }

  update() {

    let selectedStation = null;


    if (this.props.station == null) {
      stations = this.getStationList();
      selectedStation = stations[0].code;
    }

    else {
      selectedStation = this.props.station;

    }

    let prevStation = selectedStation;
    let currStation = selectedStation;
    let nextStation = selectedStation;

    let neighbors = this.getNeighborStationCodes(selectedStation);

    if (neighbors[0] != null) {
      prevStation = neighbors[0];
    }

    if (neighbors[1] != null) {
      nextStation = neighbors[1];
    }

    this.setState({
      prevStation: prevStation,
      currStation: currStation,
      nextStation: nextStation
    });

    /* get trains from API */
    axios.get(`${TRAIN_POS_URL}`, {headers: {api_key: API_KEY}})
      .then(res => {
        this.setState({

          trainPos: res.data.TrainPositions
        });

        let stationColors = this.getAllStationColors();

        let trainsToRender = _.filter(this.state.trainPos, (train) => {
          //If train does not match any station colors, discard
          if (!stationColors.includes(train.LineCode)) {
            return false;
          }

          let colorIndex = this.convertColorToTrackIndex(train.LineCode, train.DirectionNum);

          let trainSeq = this.getSequenceNumber(colorIndex, train.CircuitId);
          if (trainSeq == null) {
            return false;
          }

          let prevSeq = this.getSequenceNumber(colorIndex, this.getStationCircuitId(this.state.prevStation, train.DirectionNum, colorIndex));
          let nextSeq = this.getSequenceNumber(colorIndex, this.getStationCircuitId(this.state.nextStation, train.DirectionNum, colorIndex));

          if (trainSeq >= prevSeq && trainSeq <= nextSeq) {
            return true;
          }

          else {
            return false;
          }
        });

        let outputList = trainsToRender.map((train) => {
          let isRight = null;
          let color = this.convertColorCode(train.LineCode);
          let colorIndex = this.convertColorToTrackIndex(train.LineCode, train.DirectionNum);
          let yLocation = (train.DirectionNum === 1) ? 1 : -1;
          let distance = 0;
          let percentage = 0;

          let trainSeq = this.getSequenceNumber(colorIndex, train.CircuitId);
          let currSeq = this.getSequenceNumber(colorIndex, this.getStationCircuitId(this.state.currStation, train.DirectionNum, colorIndex));

          if (trainSeq > currSeq) {
            isRight = true;
            let nextSeq = this.getSequenceNumber(this.convertColorToTrackIndex(train.LineCode, train.DirectionNum), this.getStationCircuitId(this.state.nextStation, train.DirectionNum, colorIndex));
            distance = nextSeq - currSeq;

            percentage = ((trainSeq - currSeq) / distance);
          }

          else {
            isRight = false;
            let prevSeq = this.getSequenceNumber(this.convertColorToTrackIndex(train.LineCode, train.DirectionNum), this.getStationCircuitId(this.state.prevStation, train.DirectionNum, colorIndex));
            distance = currSeq - prevSeq;
            percentage = ((trainSeq - prevSeq) / distance);
          }

          return ({
            right: isRight,
            height: yLocation,
            color: color,
            percentage: percentage
          })
        });

        this.setState({trains: outputList});

      });

    /* run parent function once per second */
    let timer = setTimeout(this.update.bind(this), 1000);
    this.setState({
      timer: timer
    });
  }

  componentWillUnmount() {
    clearTimeout(this.state.timer);
  }

  render() {
    if (this.state.trains == null) {
      return (
        <Text>Loading...</Text>
      )
    }
    else {
      return (

        <Svg height="150" width="600">
          {/* directions from perspective of group 1 (N/E) */}
          {/* prev to curr - low */}
          <Line
            x1="50"
            y1="85"
            x2="550"
            y2="85"
            stroke="black"
            strokeWidth="2"
            strokeDasharray="6"
          />
          {/* prev to curr - high */}
          <Line
            x1="50"
            y1="115"
            x2="550"
            y2="115"
            stroke="black"
            strokeWidth="2"
            strokeDasharray="6"
          />
          {/* prev station */}
          <Circle
            r="30"
            cx="100"
            cy="100"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
          {/* curr station */}
          <Circle
            r="30"
            cx="300"
            cy="100"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
          {/* next station */}
          <Circle
            r="30"
            cx="500"
            cy="100"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
          {this.state.trains.map((train, index) => (
            <Circle
              key={index}
              r="10"
              cx={((train.right ? 300 : 100) + 200 * train.percentage).toString()}
              cy={(100 + 15 * (-train.height)).toString()}
              fill={train.color}
            />
          ))}
        </Svg>
      )
    }
  }
}


const styles = StyleSheet.create({
  stationTitle: {textAlign: 'center', fontWeight: 'bold'},
  scrollContainer: {paddingVertical: 20, paddingBottom: 30},
  container: { flex: 1, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
  head: { height: 40, backgroundColor: '#f1f8ff' },
  text: { margin: 6 }
});



AppRegistry.registerComponent('MetroTracker', () => App);
