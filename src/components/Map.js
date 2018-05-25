import React from "react"
import axios from 'axios'
import _ from 'underscore'

import Routes from '../resources/routes.json'
import Stations from '../resources/stations.json'

import API_KEY from '../private/API_KEY'

const TRAIN_POS_URL = 'https://api.wmata.com/TrainPositions/TrainPositions?contentType={contentType}'

class Map extends React.Component {
  constructor(props) {
    super(props);

    let prevStation = props.station;
    let currStation = props.station;
    let nextStation = props.station;

    let neighbors = this.getNeighborStationCodes(props.station);

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
    let seq = _.findWhere(Routes.StandardRoutes[lineIndex].TrackCircuits, {CircuitId: circuitId});

    if (seq == null) {
      return null;
    }

    return seq.SeqNum;
  }

  getNeighborStationCodes(code) {
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
        <div>Loading...</div>
      )
    }
    else {
      return (
        <svg viewBox="0 0 60 20">
          {/* directions from perspective of group 1 (N/E) */}
          {/* prev to curr - low */}
          <line
            x1={5}
            y1={8.5}
            x2={55}
            y2={8.5}
            stroke="black"
            strokeWidth={0.2}
            strokeDasharray={.6}
          />
          {/* prev to curr - high */}
          <line
            x1={5}
            y1={11.5}
            x2={55}
            y2={11.5}
            stroke="black"
            strokeWidth={0.2}
            strokeDasharray={.6}
          />
          {/* prev station */}
          <circle
            r={3}
            cx={10}
            cy={10}
            fill="white"
            stroke="black"
            strokeWidth={0.2}
          />
          {/* curr station */}
          <circle
            r={3}
            cx={30}
            cy={10}
            fill="white"
            stroke="black"
            strokeWidth={0.2}
          />
          {/* next station */}
          <circle
            r={3}
            cx={50}
            cy={10}
            fill="white"
            stroke="black"
            strokeWidth={0.2}
          />
          {this.state.trains.map((train, index) => (
            <circle
              key={index}
              r={1}
              cx={(train.right ? 30 : 10) + 20 * train.percentage}
              cy={10 + 1.5 * (-train.height)}
              fill={train.color}
            />
          ))}
        </svg>
      )
    }
  }
}

export default Map;
