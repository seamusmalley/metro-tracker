import React from 'react'
import axios from 'axios'
import API_KEY from '../private/API_KEY'

const TRAIN_URL = 'https://api.wmata.com/StationPrediction.svc/json/GetPrediction/'
const STATION_URL = 'https://api.wmata.com/Rail.svc/json/jStationInfo[?StationCode]'

/* code logic ok, something wrong with input/output */

export const getTrains = (stationCode) => {
  axios.get(`${TRAIN_URL + this.state.station}`,
            {headers: {api_key: API_KEY}})
    .then(res => {
      return res.data.trains;
    });
}

export const getStation = (stationCode) => {
  axios.get(`${STATION_URL}`,
            {headers: {api_key: API_KEY}},
            {params: {StationCode: stationCode}})
    .then(res => {
      return res.data.Name;
    });
}
