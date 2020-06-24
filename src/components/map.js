import React, { Component } from "react";
import mapboxgl from "mapbox-gl";
import "../App.css";
import { FormatPriceAbbrev, numWithCommas } from "../helpers/helpers";
const neighborhood_data = require("../data/neighborhoods_reddit.json");
const neighborhood_tax_data = require("../data/neighborhoods_med_tax.json");
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const calculateETRIndex = (etr) => {
  // max etr of .128 would put the data into 8 buckets for color mapping
  let etr_index = Math.ceil(etr * 10000);
  etr_index = Math.floor(etr_index / 12) - 1;
  if (etr_index > 7) {
    etr_index = 7;
  }

  return etr_index;
};

// 8 buckets
const color_mapping = [
  [0, "#FAD5B8"],
  [1, "#F3AF92"],
  [2, "#E38A70"],
  [3, "#CD6952"],
  [4, "#B14A39"],
  [5, "#912E24"],
  [6, "#6F1613"],
  [7, "#4B0302"],
];

const preprocessNeighborhood = (neighborhood_data, neighborhood_tax_data) => {
  let enriched_neighborhood_data = { ...neighborhood_data };
  enriched_neighborhood_data.features.map((feature) => {
    let tax_data = neighborhood_tax_data.filter((n) => n.neighborhood === feature.properties.Name);
    if (tax_data && tax_data.length) {
      tax_data = tax_data[0];
      feature.properties = { ...feature.properties, ...tax_data };
      feature.properties.etr_index = calculateETRIndex(feature.properties.med_etr);
    }

    return feature;
  });

  // removes staten island polygons
  enriched_neighborhood_data.features = enriched_neighborhood_data.features.filter(
    (feature) => feature.properties.boro !== undefined
  );

  return enriched_neighborhood_data;
};

const enriched_neighborhood_data = preprocessNeighborhood(neighborhood_data, neighborhood_tax_data);

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lng: -73.8907,
      lat: 40.7351,
      zoom: 10.35,
      bounds: [
        [-74.357224, 40.495717], // southwest
        [-73.400462, 41.022003], // northeast
      ],
      remove_layers: [
        "road",
        "aeroway",
        "road",
        "airport",
        "poi",
        "place-city-lg-n",
        "place-city-lg-s",
        "place-city-md-n",
        "place-city-md-s",
        "place-city-sm",
        "place-town",
        "place-village",
        "place-suburb",
        "place-hamlet",
      ],
      allowed_layers: ["road-motorway", "road-street", "road-primary", "road-secondary-tertiary", "road-label-large"],
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/dark-v9",
      center: [this.state.lng, this.state.lat],
      zoom: 0,
      maxBounds: this.state.bounds,
    });

    map.on("move", () => {
      this.setState({
        lng: map.getCenter().lng.toFixed(4),
        lat: map.getCenter().lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      });
    });

    map.on("load", () => {
      const { remove_layers, allowed_layers } = this.state;
      let layers = map.getStyle().layers;
      let filterable_layers = layers.filter((style) => {
        return remove_layers.reduce((accum, val) => accum || style.id.indexOf(val) > -1, false);
      });

      for (let layer of filterable_layers) {
        if (allowed_layers.indexOf(layer.id) < 0) {
          map.removeLayer(layer.id);
        }
      }

      map.addSource("nyc-property-tax", {
        type: "geojson",
        data: enriched_neighborhood_data,
      });

      // adding neighborhood polygon layer
      map.addLayer({
        id: "neighborhood-polygons",
        type: "fill",
        source: "nyc-property-tax",
        paint: {
          "fill-color": {
            property: "etr_index",
            stops: color_mapping,
          },
          "fill-opacity": 0.6,
        },
        filter: ["==", "$type", "Polygon"],
      });

      // add another layer for neighborhood border
      map.addLayer({
        id: "neighborhood-polygon-lines",
        type: "line",
        source: "nyc-property-tax",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#000000",
          "line-width": 0.3,
        },
      });
    });

    // show popup on click
    map.on("click", "neighborhood-polygons", function (e) {
      let { Name, med_etr, med_mkt_val } = e.features[0].properties;
      let med_etr_formatted = (med_etr * 100).toFixed(2) + "%";
      let med_mkt_val_formatted = FormatPriceAbbrev(med_mkt_val);
      let tax_bill = numWithCommas(med_mkt_val * med_etr);
      let html = `<b>${Name}</b><br>Median price: ${med_mkt_val_formatted}<br>Median ETR: ${med_etr_formatted}<br>➥Tax Bill: ${tax_bill}`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on("mouseenter", "neighborhood-polygons", function () {
      map.getCanvas().style.cursor = "pointer";
    });

    // Change it back to a pointer when it leaves.
    map.on("mouseleave", "neighborhood-polygons", function () {
      map.getCanvas().style.cursor = "";
    });
  }

  render() {
    return (
      <div>
        <div>
          <div className="sidebarStyle">
            <p>
              <b>NYC Property Tax Rate (Class 1)</b>
            </p>
            <p>Select a neighborhood for more info.</p>
          </div>
        </div>
        <div ref={(el) => (this.mapContainer = el)} className="mapContainer" />
      </div>
    );
  }
}

export default Map;